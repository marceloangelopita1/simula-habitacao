#!/usr/bin/env python3
"""Ponte MCP local para recuperar node_repl Windows chamado a partir do WSL.

Veja docs/browser.md. Não controla o Chrome diretamente, não altera permissões
e não aceita solicitações de autorização automaticamente. Python >= 3.11.
"""

import argparse
import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import threading
import time
import tomllib


def emit(prefix, value):
    print(prefix + " " + json.dumps(value, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--windows-profile", required=True, type=Path,
                        help="Perfil Windows montado no WSL que contém .codex/config.toml")
    parser.add_argument("--check", action="store_true",
                        help="Verifica initialize/tools/list; não acessa o navegador")
    args = parser.parse_args()
    profile = args.windows_profile.resolve(strict=True)
    config_path = profile / ".codex" / "config.toml"
    with config_path.open("rb") as stream:
        config = tomllib.load(stream)["mcp_servers"]["node_repl"]
    if config.get("enabled") is False:
        raise ValueError("O servidor node_repl está desativado na configuração.")
    command = config.get("command")
    arguments = config.get("args", [])
    if not isinstance(command, str) or not command:
        raise ValueError("node_repl precisa ter command de um servidor stdio instalado.")
    if not isinstance(arguments, list) or not all(isinstance(x, str) for x in arguments):
        raise ValueError("args do node_repl precisa ser uma lista de strings.")
    environment = os.environ.copy()
    environment.update(config.get("env", {}))
    # Mesmo executável, argumentos e ambiente configurados; só o cwd é nativo.
    # shell=False evita interpretar command/args como código de shell.
    process = subprocess.Popen(
        [command, *arguments], cwd=profile, env=environment, shell=False,
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, encoding="utf-8", bufsize=1,
    )
    messages = queue.Queue()

    def read_messages():
        try:
            for line in process.stdout:
                messages.put(line)
        finally:
            messages.put(None)

    threading.Thread(target=read_messages, daemon=True).start()

    def send(message):
        process.stdin.write(json.dumps(message) + "\n")
        process.stdin.flush()

    def request(identifier, method, params):
        send({"jsonrpc": "2.0", "id": identifier, "method": method, "params": params})
        deadline = time.monotonic() + 90
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("Sem resposta MCP em 90 segundos.")
            try:
                line = messages.get(timeout=remaining)
            except queue.Empty as error:
                raise TimeoutError("Sem resposta MCP em 90 segundos.") from error
            if line is None:
                raise RuntimeError("O servidor node_repl encerrou a conexão.")
            try:
                response = json.loads(line)
            except json.JSONDecodeError:
                continue
            if response.get("method") == "elicitation/create":
                emit("MCP_ELICITATION", response)
                # O controlador deve conferir escopo/autorização antes de responder.
                answer_line = sys.stdin.readline()
                if not answer_line:
                    raise EOFError("Conexão encerrada durante uma solicitação MCP.")
                answer = json.loads(answer_line)
                if answer.get("action") not in {"accept", "decline", "cancel"}:
                    raise ValueError("Resposta de autorização MCP inválida.")
                send({"jsonrpc": "2.0", "id": response["id"], "result": answer})
                deadline = time.monotonic() + 90
            elif response.get("id") == identifier:
                return response
            elif "method" in response and "id" in response:
                send({"jsonrpc": "2.0", "id": response["id"], "error": {
                    "code": -32601, "message": "Método não suportado pela ponte local",
                }})

    try:
        initialized = request(1, "initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {"elicitation": {"form": {}}},
            "clientInfo": {"name": "simula-native-node-repl", "version": "1.0"},
        })
        if "error" in initialized:
            raise RuntimeError("O servidor recusou initialize; revise a integração instalada.")
        send({"jsonrpc": "2.0", "method": "notifications/initialized"})
        if args.check:
            result = request(2, "tools/list", {})
            names = {tool.get("name") for tool in result.get("result", {}).get("tools", [])}
            if "js" not in names:
                raise RuntimeError("O servidor configurado não expôs a ferramenta js.")
            print("MCP_CHECK_OK: node_repl expõe js; navegador não acessado.", flush=True)
            return
        print("MCP_READY", flush=True)
        for identifier, line in enumerate(sys.stdin, 2):
            payload = json.loads(line)
            if payload.get("exit") is True:
                break
            if not isinstance(payload.get("code"), str):
                raise ValueError("Envie code como string ou exit: true.")
            emit("MCP_RESULT", request(identifier, "tools/call", {
                "name": "js", "arguments": payload,
            }))
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
    except (OSError, ValueError, KeyError, EOFError, RuntimeError, TimeoutError):
        # Não imprimir configuração, ambiente ou payloads que possam ter segredos.
        print("Falha na ponte node_repl; confira os pré-requisitos em docs/browser.md.", file=sys.stderr)
        sys.exit(1)
