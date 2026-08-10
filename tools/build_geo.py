#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
시군구 경계 빌더 (rcssp_map sgg.topojson → static/data/geo/sigungu.json)
================================================================
원 경계(행정안전부 코드 체계, 구 단위 분리)를 지역사회보장지표의
시군구 229개 체계(통계청 코드, 구 보유 시는 시 단위)로 변환함.

  1) TopoJSON 디코딩(호 델타 복원)
  2) 구 보유 시(수원·성남 등) 폴리곤 병합(dissolve)
  3) (시도명, 시군구명) 매칭으로 지표 지역코드 부여
  4) 좌표 4자리 반올림 GeoJSON 출력

사용법: python tools/build_geo.py <sgg.topojson> <regions.json> <출력.json>
의존성: shapely
"""
import sys, json, unicodedata
from collections import defaultdict
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

# 시도명 표준화(행안부 표기 → 지표 표기 병행 수용)
SIDO_ALIAS = {
    "강원도": "강원특별자치도", "전라북도": "전북특별자치도",
    "제주도": "제주특별자치도",
}


def norm(s):
    return unicodedata.normalize("NFC", str(s)).strip()


def decode_topojson(tj):
    """TopoJSON → (properties, shapely geometry) 목록"""
    tr = tj.get("transform")
    sx, sy = (tr["scale"] if tr else (1, 1))
    tx, ty = (tr["translate"] if tr else (0, 0))
    arcs = []
    for arc in tj["arcs"]:
        pts, x, y = [], 0, 0
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty) if tr else (x, y))
        arcs.append(pts)

    def ring(arc_idx):
        pts = []
        for i in arc_idx:
            a = arcs[~i][::-1] if i < 0 else arcs[i]
            pts.extend(a if not pts else a[1:])
        return pts

    obj = list(tj["objects"].values())[0]
    out = []
    for g in obj["geometries"]:
        if g["type"] == "Polygon":
            geom = {"type": "Polygon",
                    "coordinates": [ring(r) for r in g["arcs"]]}
        elif g["type"] == "MultiPolygon":
            geom = {"type": "MultiPolygon",
                    "coordinates": [[ring(r) for r in poly] for poly in g["arcs"]]}
        else:
            continue
        out.append((g.get("properties", {}), shape(geom)))
    return out


def round_coords(o, nd=4):
    if isinstance(o, (list, tuple)):
        if o and isinstance(o[0], float):
            return [round(o[0], nd), round(o[1], nd)]
        return [round_coords(x, nd) for x in o]
    return o


def main():
    tj_path, rg_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
    tj = json.load(open(tj_path, encoding="utf-8"))
    regions = json.load(open(rg_path, encoding="utf-8"))
    sgg = [r for r in regions if r["level"] == "시군구"]
    target = {}
    for r in sgg:
        sido, name, code = norm(r["sido"]), norm(r["sigungu"]), r["code"]
        keys = {name}
        if "(" in name:                       # 예: 남구(미추홀구) → 남구, 미추홀구
            base, rest = name.split("(", 1)
            keys |= {base.strip(), rest.rstrip(")").strip()}
        if name == sido:                      # 세종특별자치시(단일 행정구역)
            keys |= {"세종시", sido}
        for k in keys:
            key = (sido, k)
            if key in target and target[key] != code:
                continue                      # 시도 내 별칭 충돌 시 원명만 유지
            target[key] = code
    canon = {r["code"]: norm(r["sigungu"]) for r in sgg}

    feats = decode_topojson(tj)

    # 병합 대상: '○○시△△구' 명칭이면 대상 시군구명이 '○○시'가 됨
    grouped = defaultdict(list)
    for props, geom in feats:
        sido = norm(props["sidonm"]); sido = SIDO_ALIAS.get(sido, sido)
        name = norm(props["sggnm"])
        if "시" in name and not name.endswith("시"):        # 예: 수원시장안구
            name = name.split("시", 1)[0] + "시"           # → 수원시
        grouped[(sido, name)].append(geom)

    unmatched, features = [], []
    for (sido, name), geoms in sorted(grouped.items()):
        code = target.get((sido, name))
        if code is None:
            unmatched.append((sido, name)); continue
        geom = unary_union(geoms) if len(geoms) > 1 else geoms[0]
        gj = mapping(geom)
        gj["coordinates"] = round_coords(gj["coordinates"])
        features.append({"type": "Feature", "id": code,
                         "properties": {"code": code, "sido": sido,
                                        "name": canon.get(code, name)},
                         "geometry": gj})

    missing = sorted(set(target.values()) - {f["id"] for f in features})
    print(f"피처 {len(feats)}개 → 병합 후 {len(grouped)}개 → 매칭 {len(features)}개")
    if unmatched: print("⚠ 경계는 있으나 지표 지역에 미매칭:", unmatched)
    if missing:
        nm = {v: k for k, v in target.items()}
        print("⚠ 지표 지역이나 경계 없음:", [(c, nm[c]) for c in missing])

    fc = {"type": "FeatureCollection",
          "name": "지역사회보장지표 시군구 경계",
          "source": "행정안전부 행정동 경계(vuski/admdongkor) 기반, "
                    "지표 코드 체계로 병합·재부여",
          "features": features}
    json.dump(fc, open(out_path, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    import os
    print(f"저장: {out_path} ({os.path.getsize(out_path)/1e6:.2f} MB)")


if __name__ == "__main__":
    main()
