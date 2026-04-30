"""
ChromaDB client utility — manages the vector store for community data.
"""

import os
from typing import Optional

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings


def get_chroma_retriever(
    collection_name: str = "nova_community",
    persist_directory: Optional[str] = None,
    k: int = 5,
):
    """
    Get a ChromaDB retriever for community event data.

    Uses Google's embedding model for Hebrew text support.
    Returns an MMR-based retriever for diverse results.
    """
    if persist_directory is None:
        persist_directory = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "chroma_db"
        )
    persist_directory = os.path.abspath(persist_directory)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004"
    )

    vectorstore = Chroma(
        collection_name=collection_name,
        persist_directory=persist_directory,
        embedding_function=embeddings,
    )

    retriever = vectorstore.as_retriever(
        search_type="mmr",  # Maximal Marginal Relevance for diversity
        search_kwargs={"k": k},
    )

    return retriever


def get_chroma_vectorstore(
    collection_name: str = "nova_community",
    persist_directory: Optional[str] = None,
):
    """Get the raw ChromaDB vectorstore for ingestion purposes."""
    if persist_directory is None:
        persist_directory = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "chroma_db"
        )
    persist_directory = os.path.abspath(persist_directory)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004"
    )

    return Chroma(
        collection_name=collection_name,
        persist_directory=persist_directory,
        embedding_function=embeddings,
    )
