"""M1911 profile, landmarks measured off Browning's patent plate (mm; +X muzzle, +Y down)."""
import subprocess
S = r"C:/Users/leepe/AppData/Local/Temp/claude/c--Users-leepe-Desktop-Gunbuilderapp/7daa5906-f9b6-4690-89a7-6bce10245f10/scratchpad"

# --- measured landmarks (y shifted so the slide's top rib is 0) -------------
SLIDE_X0, MUZZLE = 24.0, 214.5
SLIDE_TOP, SLIDE_BOT = 0.0, 25.5
DUST_NOSE, DUST_BOT = 180.0, 42.0
RECV_BOT = 58.0
GUARD_F, GUARD_R, GUARD_BOT = 131.0, 92.0, 71.0
BS_TOP, BUTT_REAR = (10.0, 30.0), (14.0, 131.0)   # tang is rearmost; backstrap bows forward
FS_TOP, BUTT_FRONT = (88.0, 57.0), (75.0, 131.0)
TANG = (2.0, 26.0)

def frame_path():
    return "".join([
        f"M{TANG[0]},{TANG[1]}",
        f"C{TANG[0]+3},{TANG[1]-8} 16,{SLIDE_BOT-3} 28,{SLIDE_BOT}",       # tang into the rail
        f"L{DUST_NOSE},{SLIDE_BOT}",                                        # rail top
        f"L{DUST_NOSE+4},{SLIDE_BOT+5}",
        f"L{DUST_NOSE+4},{DUST_BOT-4}",
        f"L{DUST_NOSE-3},{DUST_BOT}",                                       # dust-cover underside
        f"L{GUARD_F+8},{DUST_BOT}",
        f"L{GUARD_F+2},{RECV_BOT-4}",
        f"L{GUARD_F},{RECV_BOT}",
        f"C{GUARD_F+1},{RECV_BOT+7} {GUARD_F-4},{GUARD_BOT} {GUARD_F-14},{GUARD_BOT}",   # guard bow
        f"L{GUARD_R+8},{GUARD_BOT}",
        f"C{GUARD_R},{GUARD_BOT} {FS_TOP[0]-6},{GUARD_BOT-6} {FS_TOP[0]},{FS_TOP[1]}",
        f"L{BUTT_FRONT[0]},{BUTT_FRONT[1]}",                                # front strap
        f"C{BUTT_FRONT[0]-2},{BUTT_FRONT[1]+8} {BUTT_REAR[0]+10},{BUTT_REAR[1]+7} {BUTT_REAR[0]},{BUTT_REAR[1]}",
        f"C{BUTT_REAR[0]+12},{BUTT_REAR[1]-34} 26,{TANG[1]+34} {TANG[0]},{TANG[1]}",   # backstrap
        "Z"])

def guard_hole():
    return "".join([
        f"M{GUARD_F-6},{RECV_BOT+1}",
        f"C{GUARD_F-5},{RECV_BOT+7} {GUARD_F-10},{GUARD_BOT-5} {GUARD_F-18},{GUARD_BOT-5}",
        f"L{GUARD_R+10},{GUARD_BOT-5}",
        f"C{GUARD_R+4},{GUARD_BOT-5} {FS_TOP[0]-8},{GUARD_BOT-9} {FS_TOP[0]-5},{FS_TOP[1]+2}Z"])

def slide_path():
    x0, x1, yT, yB = SLIDE_X0, MUZZLE, SLIDE_TOP, SLIDE_BOT
    return (f"M{x0},{yT+3}A3,3 0 0 1 {x0+3},{yT}L{x1-5},{yT}A5,5 0 0 1 {x1},{yT+5}"
            f"L{x1},{yB-3}A3,3 0 0 1 {x1-3},{yB}L{x0+2},{yB}A2,2 0 0 1 {x0},{yB-2}Z")

def grip_pt(u, v):
    top = (BS_TOP[0]+(FS_TOP[0]-BS_TOP[0])*u, BS_TOP[1]+(FS_TOP[1]-BS_TOP[1])*u)
    bot = (BUTT_REAR[0]+(BUTT_FRONT[0]-BUTT_REAR[0])*u, BUTT_REAR[1]+(BUTT_FRONT[1]-BUTT_REAR[1])*u)
    return (top[0]+(bot[0]-top[0])*v, top[1]+(bot[1]-top[1])*v)

def panel_path():
    a,b,c,d = grip_pt(.16,.20), grip_pt(.84,.20), grip_pt(.84,.86), grip_pt(.16,.86)
    return (f"M{a[0]:.1f},{a[1]:.1f}L{b[0]:.1f},{b[1]:.1f}A130,130 0 0 1 {c[0]:.1f},{c[1]:.1f}"
            f"L{d[0]:.1f},{d[1]:.1f}A130,130 0 0 1 {a[0]:.1f},{a[1]:.1f}Z")

def hammer_path():
    px, py = 14.0, 26.0
    return (f"M{px-2},{py} C{px-10},{py-9} {px-8},{py-19} {px-1},{py-21}"
            f"L{px+6},{py-19} L{px+4},{py-14}"
            f"C{px+4},{py-8} {px+3},{py-3} {px+3},{py}Z")

def trigger_path():
    x, yT, yB, w = 100.0, RECV_BOT-10, GUARD_BOT-8, 6.5
    return f"M{x},{yT}L{x+w},{yT}L{x+w},{yB-2}A2.8,2.8 0 0 1 {x},{yB-2}Z"

def build_svg():
    S1 = 'fill="none" stroke="#cddbe6" stroke-width="1" stroke-linejoin="round"'
    T1 = 'fill="none" stroke="#8ea3b5" stroke-width="0.5"'
    ser = "".join(f'<path d="M{34+i*3.2},4 L{34+i*3.2},{SLIDE_BOT-7}" {T1}/>' for i in range(16))
    checks = "".join(
        f'<path d="M{grip_pt(.19,t)[0]:.1f},{grip_pt(.19,t)[1]:.1f} L{grip_pt(.81,t)[0]:.1f},{grip_pt(.81,t)[1]:.1f}" {T1}/>'
        for t in [.22+i*.048 for i in range(14)]) + "".join(
        f'<path d="M{grip_pt(u,.22)[0]:.1f},{grip_pt(u,.22)[1]:.1f} L{grip_pt(u,.84)[0]:.1f},{grip_pt(u,.84)[1]:.1f}" {T1}/>'
        for u in [.19+i*.062 for i in range(11)])
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="800" viewBox="-24 -18 260 160">
<rect x="-24" y="-18" width="260" height="160" fill="#0d1116"/>
<path d="{frame_path()}" {S1}/><path d="{guard_hole()}" {S1}/>
<path d="{hammer_path()}" {S1}/><path d="{slide_path()}" {S1}/>
<path d="{panel_path()}" {S1}/>{checks}
<path d="{trigger_path()}" {S1}/>{ser}
<path d="M{SLIDE_X0+80},5 h40 v11 h-40 Z" {T1}/>
<path d="M28,{SLIDE_BOT-6} L{MUZZLE-4},{SLIDE_BOT-6}" {T1}/>
</svg>"""

if __name__ == "__main__":
    svg = build_svg()
    open(S+"/profile.html","w").write('<html><body style="margin:0;background:#0d1116">'+svg+'</body></html>')
    subprocess.run([r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe","--headless=new",
        "--disable-gpu",f"--user-data-dir={S}/edge-lab5","--virtual-time-budget=4000",
        "--window-size=1320,820",f"--screenshot={S}/profile.png",f"file:///{S}/profile.html"],capture_output=True)
    print("rendered")
