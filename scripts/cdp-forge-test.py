import json, subprocess, time, base64, urllib.request
import websocket
EDGE = r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
S = r"C:/Users/leepe/AppData/Local/Temp/claude/c--Users-leepe-Desktop-Gunbuilderapp/7daa5906-f9b6-4690-89a7-6bce10245f10/scratchpad"
PORT = 9362
proc = subprocess.Popen([EDGE, "--headless=new", "--disable-gpu", f"--remote-debugging-port={PORT}",
    "--remote-allow-origins=*", f"--user-data-dir={S}/edge-forge-cdp3", "--window-size=1600,1000",
    "http://localhost:3000/forge"])
time.sleep(5)
page = None
for _ in range(20):
    try:
        t = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
        page = next(x for x in t if x["type"] == "page" and "forge" in x.get("url", ""))
        break
    except Exception: time.sleep(1)
ws = websocket.create_connection(page["webSocketDebuggerUrl"], timeout=120)
mid = 0
def send(m, p=None):
    global mid; mid += 1
    ws.send(json.dumps({"id": mid, "method": m, "params": p or {}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == mid: return r.get("result", {})
def ev(e):
    r = send("Runtime.evaluate", {"expression": e, "returnByValue": True})
    if "exceptionDetails" in r: print("ERR", str(r["exceptionDetails"])[:160])
    return r.get("result", {}).get("value")
def shot(n):
    d = send("Page.captureScreenshot", {"format": "jpeg", "quality": 82})
    open(f"{S}/{n}.jpg", "wb").write(base64.b64decode(d["data"]))
def drag(x1, y1, x2, y2, steps=18):
    send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x1, "y": y1, "button": "left", "clickCount": 1})
    for i in range(1, steps + 1):
        send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x1+(x2-x1)*i/steps, "y": y1+(y2-y1)*i/steps, "button": "left"})
        time.sleep(0.02)
    time.sleep(0.1)
    send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x2, "y": y2, "button": "left", "clickCount": 1})

send("Page.enable"); send("Runtime.enable")
time.sleep(6)
print("svg present:", ev("!!document.querySelector('svg[role=application]')"))
rect = ev("(()=>{const s=document.querySelector('svg[role=application]');const r=s.getBoundingClientRect();return [r.left,r.top,r.width,r.height];})()")
print("canvas rect:", rect)
L, T, W, H = rect
# TEST 1: click the slide (upper body of the gun ~ 45% across, 32% down) and drag it up
drag(L + W*0.45, T + H*0.30, L + W*0.45, T + H*0.14)
time.sleep(0.6)
print("inspector after slide drag:", ev("""(()=>{const el=[...document.querySelectorAll('*')].find(n=>n.className&&String(n.className).includes('heading-stencil')&&/Slide|Frame|Grip|Barrel|Trigger|Hammer|Magazine/.test(n.textContent||''));return el?el.textContent:null;})()"""))
print("Y field:", ev("""(()=>{const ls=[...document.querySelectorAll('label')];const l=ls.find(x=>/Y \(mm\)/.test(x.textContent||''));return l?l.querySelector('input')?.value:null;})()"""))
shot("forge-t1-moved")
# TEST 2: exploded view
ev("""(()=>{const r=[...document.querySelectorAll('input[type=range]')][0];
const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
set.call(r,'1'); r.dispatchEvent(new Event('input',{bubbles:true}));})()""")
time.sleep(1)
shot("forge-t2-exploded")
print("done")
ws.close(); proc.terminate()
