from aiwen_loc import mcp

if __name__ == "__main__":
    from argparse import ArgumentParser
    parser = ArgumentParser()
    parser.add_argument("--transport", choices=["stdio", "sse"], default="stdio")
    args = parser.parse_args()
    print(args.transport)
    if args.transport == "stdio":
        mcp.run("stdio")
    elif args.transport == "sse":
        mcp.run("sse")
    else:
        mcp.run()