import json, argparse
from ollama import chat
from jinja2 import Template
from pathlib import Path
from bs4 import BeautifulSoup


MODEL = "qwen3.5:9b"

root = Path(__file__).resolve().parent.parent
HTML_PATH = root / "assets/resume.html"
OUTPUT_MD = root / "README.md"
CACHE_DIR = root / ".cache"
TEMP_JSON = CACHE_DIR /  "resume-data.json"
TEMPLATE_PATH = root / "gen/template.readme.j2"


PROMPT = """
Extract resume data from HTML into the following JSON format. 
Be concise and accurate and keep original content.

JSON Structure:
{{
  "firstname": "",
  "lastname": "",
  "tagline": "",
  "location": "",
  "contact": {{"email": "", "linkedin": ""}},
  "experience": [
    {{"role": "", "company": "", "period": "", "bullets": [""]}}
  ],
  "projects": [
    {{"name": "", "link": "", "description": ""}}
  ],
  "skills": {{"core": [], "libraries": []}}
}}

Rules:
- Output ONLY valid **JSON data**.
- No markdown formatting in the response.
- Ensure skills are categorized.
- Extract links (a) from a project and add as `link`. Leave empty if there is no link.

HTML:
{html_content}
"""

def get_clean_html():
    if not HTML_PATH.exists():
        raise FileNotFoundError(f"Oops. Missing {HTML_PATH}")
    soup = BeautifulSoup(HTML_PATH.read_text(encoding="utf-8"), "html.parser")
    
    # make sure links are includes in text
    for a in soup.find_all("a"):
        text = a.get_text(strip=True)
        href = a.get("href", "")
        a.replace_with(f"{text} ({href})")
        
    return soup.find("body").get_text(strip=False)

def main():
    parser = argparse.ArgumentParser(description="Generate a fancy GitHub README from an HTML resume.")

    parser.add_argument('--no-cache', action='store_false', dest='use_cache', help="Skip the cache and force LLM generation")
    parser.add_argument('--model', type=str, default=MODEL, help=f"Ollama model to use (default: {MODEL})")
    args = parser.parse_args()

    data = {}
    
    if not TEMPLATE_PATH.exists():
        print(f"Oi.. template file is not there: {TEMPLATE_PATH}")
        return

    if args.use_cache and TEMP_JSON.exists():
        try:
            data = json.loads(TEMP_JSON.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Uups failed to load cache")
            args.use_cache = False

    if not data:
        html_text = get_clean_html()
        response = chat(
            model=args.model,
            messages=[{'role': 'user', 'content': PROMPT.format(html_content=html_text)}],
            format="json",
            think=False,
            options={"temperature": 0.1}
        )
        content = response.message.content

        try:            
            data = json.loads(content) if isinstance(content, str) else content
  
            CACHE_DIR.mkdir(exist_ok=True)
            TEMP_JSON.write_text(json.dumps(data, indent=2), encoding="utf-8")
                    
        except Exception as e:
            print("Error parsing LLM output:")
            print(content)
            print(e)
            return
    template_str = TEMPLATE_PATH.read_text(encoding="utf-8")
    template = Template(template_str)
    
    # data['fullname'] = f"{data.get('firstname', '')} {data.get('lastname', '')}".strip()
    
    rendered_md = template.render(**data)

    OUTPUT_MD.write_text(rendered_md, encoding="utf-8")
    print(f"Done: {OUTPUT_MD.resolve()}")

if __name__ == "__main__":
    main()