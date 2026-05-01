import asyncio
from novahub.graph import build_graph

async def main():
    graph = build_graph()
    try:
        config = {"configurable": {"thread_id": "test_thread_1"}}
        result = graph.invoke({
            "user_query": "מה הזכויות של 100% נכות?",
            "messages": [],
            "rewrite_count": 0,
            "sources": [],
            "safety_issues": [],
        }, config=config)
        print(result)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
