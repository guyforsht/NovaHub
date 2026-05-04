"""
Rebuild the rights ChromaDB from the smart_data markdown files.

Run this after a scraping cycle to refresh the vector store:
    cd backend
    python scripts/ingest_rights_to_chroma.py
"""

import os
import shutil
from pathlib import Path

from dotenv import load_dotenv
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_FOLDER = BACKEND_DIR / "data" / "smart_data"
PERSIST_DIR = BACKEND_DIR / "data" / "chroma_rights_db"


def build_vector_db():
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY not set — add it to backend/.env")

    if PERSIST_DIR.exists():
        print("🗑️  Deleting old rights database...")
        shutil.rmtree(PERSIST_DIR)

    headers_to_split_on = [
        ("#", "Right Name"),
        ("##", "Sub Section"),
    ]
    markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)

    all_chunks = []

    print(f"📂 Reading files from '{DATA_FOLDER}'...")
    for filename in sorted(DATA_FOLDER.iterdir()):
        if filename.suffix == ".md":
            md_text = filename.read_text(encoding="utf-8")
            header_splits = markdown_splitter.split_text(md_text)
            chunks = text_splitter.split_documents(header_splits)
            all_chunks.extend(chunks)

    print(f"✂️  Total chunks created: {len(all_chunks)}")
    print("🧠 Building embeddings and saving to ChromaDB...")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    Chroma.from_documents(
        documents=all_chunks,
        embedding=embeddings,
        persist_directory=str(PERSIST_DIR),
    )

    print(f"✅ Rights vector DB rebuilt at '{PERSIST_DIR}' ({len(all_chunks)} chunks).")


if __name__ == "__main__":
    build_vector_db()
