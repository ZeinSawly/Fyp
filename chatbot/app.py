import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import uvicorn
import os
from dotenv import load_dotenv


load_dotenv()

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# Define request structure coming from Node.js
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    student_id: str
    messages: list[Message]

# This is the MASTER FUNCTION that calls your Node.js server for DB data
def fetch_student_data(category: str, student_id: str):
    try:
        # Python asks Node.js (on port 3000) for the data
        node_url = f"http://192.168.1.107:3000/api/students/{student_id}/{category}"
        response = requests.get(node_url)
        
        if response.status_code == 200:
            return response.text
        else:
            return json.dumps({"error": "Failed to fetch data from database."})
    except Exception as e:
        return json.dumps({"error": f"Connection to Node.js failed: {str(e)}"})


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        system_prompt = {
            "role": "system",
            "content": (
                "You are the Academic Advisor AI for the Smart-SIS platform. "
                f"The currently logged-in student has ID: {request.student_id}. "

                "If the user asks about:\n"
                "- grades → use category 'grades'\n"
                "- schedule → use category 'schedule'\n"
                "- attendance → use category 'attendance'\n"
                "- personal info like name or profile → use category 'profile'\n\n"

                "Always call the 'fetch_student_data' tool when the request matches one of these."
            )
        }

        formatted_messages = [system_prompt]
        for msg in request.messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        tools = [{
            "type": "function",
            "function": {
                "name": "fetch_student_data",
                "description": "Fetches academic and profile data for a student from the database.",
                "strict": True,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string", "enum": ["grades", "schedule", "attendance", "profile"]},
                        "student_id": {"type": "string"}
                    },
                    "required": ["category", "student_id"],
                    "additionalProperties": False
                }
            }
        }]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=formatted_messages,
            tools=tools
        )
        
        response_message = response.choices[0].message

        # Handle Function Calling if needed
        if response_message.tool_calls:
            tool_call = response_message.tool_calls[0]
            args = json.loads(tool_call.function.arguments)
            
            # Fetch real data from Node.js
            fetched_data = fetch_student_data(args["category"], args["student_id"])
            
            formatted_messages.append(response_message)
            formatted_messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": fetched_data
            })
            
            second_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=formatted_messages
            )
            return {"reply": second_response.choices[0].message.content}
            
        return {"reply": response_message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)