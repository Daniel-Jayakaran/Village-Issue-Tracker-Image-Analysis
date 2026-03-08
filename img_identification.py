from google import genai
from PIL import Image
import json
import re
import io

# Initialize Gemini client
client = genai.Client(api_key="AIzaSyAe1F0zbDB7vphWBh-JCF8SOtteJQnK-uU")


def analyze_images(image_bytes_list):
    """
    Analyze multiple images using Gemini and return structured results
    """

    images = []

    # Convert bytes → PIL images safely
    for img_bytes in image_bytes_list:
        try:
            image = Image.open(io.BytesIO(img_bytes))
            images.append(image)
        except Exception:
            images.append(None)

    prompt = """
Analyze each image and return ONLY valid JSON.

Return a JSON ARRAY where each element corresponds to one image in the same order.

Format:
[
 {
  "category": "main category of the image",
  "description": "short 2-4 line description",
  "severity_level": "severity level"
 }
]

category options:
["Road Damage", "Drainage Problem", "Water Leakage", "Environmental Issues",
 "Electricity Issues", "Public Land Property", "Street Light Issue", "Others"]

severity-level-categories:
["Critical", "High", "Medium", "Low"]

Return ONLY JSON.
No markdown.
No explanations.
"""

    try:

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt] + images
        )

        result = response.text.strip()

        # Remove markdown if Gemini adds it
        result = result.replace("```json", "").replace("```", "").strip()

        # Extract JSON safely
        match = re.search(r"\[.*\]", result, re.DOTALL)

        if not match:
            raise ValueError("JSON not found in response")

        json_text = match.group()

        data = json.loads(json_text)

        return data

    except Exception as e:

        # Fallback if Gemini response fails
        fallback = []

        for _ in image_bytes_list:
            fallback.append({
                "category": "Others",
                "description": "Unable to analyze image",
                "severity_level": "Low"
            })

        return fallback