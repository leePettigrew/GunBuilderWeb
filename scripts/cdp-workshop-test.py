"""Precision CDP tests: snap-on, occupied rejection, detach."""
import json, subprocess, time, base64, urllib.request
import websocket

EDGE = r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SCRATCH = r"C:/Users/leepe/AppData/Local/Temp/claude/c--Users-leepe-Desktop-Gunbuilderapp/7daa5906-f9b6-4690-89a7-6bce10245f10/scratchpad"
PORT = 9341
proc = subprocess.Popen([EDGE, "--headless=new", "--disable-gpu", "--enable-unsafe-swiftshader",
    f"--remote-debugging-port={PORT}", "--remote-allow-origins=*",
    f"--user-data-dir={SCRATCH}/edge-cdp9", "--window-size=1500,1000",
    "http://localhost:3000/workshop?wsdebug"])
time.sleep(5)
page = None
for _ in range(20):
    try:
        targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
        page = next(t for t in targets if t["type"] == "page" and "workshop" in t.get("url", ""))
        break
    except Exception:
        time.sleep(1)
ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=30)
mid = 0
def send(method, params=None):
    global mid; mid += 1
    ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    while True:
        msg = json.loads(ws.recv())
        if msg.get("id") == mid: return msg.get("result", {})
def ev(expr):
    r = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
    if "exceptionDetails" in r: print("EVAL ERR:", str(r["exceptionDetails"])[:200])
    return r.get("result", {}).get("value")
def shot(name):
    d = send("Page.captureScreenshot", {"format": "png"})
    open(f"{SCRATCH}/{name}.png", "wb").write(base64.b64decode(d["data"]))
def drag(x1, y1, x2, y2, steps=16):
    send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x1, "y": y1, "button": "left", "clickCount": 1})
    for i in range(1, steps + 1):
        send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x1 + (x2 - x1) * i / steps, "y": y1 + (y2 - y1) * i / steps, "button": "left"})
        time.sleep(0.02)
    time.sleep(0.15)
    send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x2, "y": y2, "button": "left", "clickCount": 1})

send("Page.enable"); send("Runtime.enable")
print('url:', ev('window.location.href'), 'ready:', ev('document.readyState'))
crect = None
for i in range(45):
    if i % 10 == 0:
        print(i, "ready:", ev("document.readyState"), "canvases:", ev("document.querySelectorAll(`canvas`).length"), "hasState:", ev("!!window.__wsState"))
    crect = ev("(() => { const c = document.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return [r.left, r.top]; })()")
    if crect and ev("JSON.stringify(Object.keys(window.__wsScreens||{}).length)") not in (None, "0"):
        break
    time.sleep(1)
CX, CY = crect
def screens(): return ev("JSON.stringify(window.__wsScreens || {})") or "{}"
def state(): return ev("JSON.stringify(window.__wsState.placed.map(p=>[p.key,p.pieceId,p.attachedTo]))")
print("initial:", state())

# TEST 1: spawn laser, drag precisely onto the under socket
ev("""(() => { const btns=[...document.querySelectorAll('button')];
  const b=btns.find(b=>b.closest('div')?.textContent?.includes('Laser module')&&b.textContent.trim()==='Spawn'); b&&b.click(); })()""")
time.sleep(1.5)
st = json.loads(state()); newkey = st[-1][0]
sc = json.loads(screens())
piece_xy = sc.get(f"piece:{newkey}"); under_xy = sc.get("socket:under")
print("laser at", piece_xy, "under socket at", under_xy)
if piece_xy and under_xy:
    drag(CX + piece_xy[0], CY + piece_xy[1], CX + under_xy[0], CY + under_xy[1])
    time.sleep(1)
print("after snap drag:", state())
shot("cdp-t1-snap")

# TEST 2: drag the mounted red dot OFF to empty space (detach)
sc = json.loads(screens())
rd = next((k for k in sc if k.startswith("piece:seed-2")), None)
if rd:
    x, y = sc[rd]
    drag(CX + x, CY + y, CX + x - 180, CY + y + 260)
    time.sleep(1)
print("after detach drag:", state())
shot("cdp-t2-detach")
ws.close(); proc.terminate()
print("done")
