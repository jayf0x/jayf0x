from weasyprint import HTML
from pathlib import Path

html_file = Path("./assets/resume.html")
pdf_file = Path("./assets/resume.pdf")


if html_file.exists() and pdf_file.exists():
    HTML(filename=str(html_file)).write_pdf(str(pdf_file))
else:
    print(f"HTML2PDF: Missing files: pdf - {pdf_file.exists()}, {html_file.exists()}")