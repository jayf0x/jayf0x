from weasyprint import HTML
from pathlib import Path

html_file = Path("./assets/resume.html")
pdf_file = Path("./assets/Jonatan Verstraete - resume 2026.pdf")


def main():
    if html_file.exists():
        HTML(filename=str(html_file)).write_pdf(str(pdf_file))

if __name__ == "__main__":
    main()