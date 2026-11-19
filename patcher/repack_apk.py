import json
import sys
import zipfile


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: repack_apk.py <src.apk> <dst.apk> <overrides.json>", file=sys.stderr)
        return 2

    src_apk, dst_apk, spec_path = sys.argv[1:4]
    with open(spec_path, "r", encoding="utf-8") as f:
        spec = json.load(f)

    replace_files = spec.get("replace", {})
    add_files = spec.get("add", {})
    remove_prefixes = tuple(spec.get("remove_prefixes", []))
    seen = set()

    with zipfile.ZipFile(src_apk, "r") as zin, zipfile.ZipFile(dst_apk, "w") as zout:
        for info in zin.infolist():
            name = info.filename
            if name.startswith("META-INF/") or (remove_prefixes and name.startswith(remove_prefixes)):
                continue

            seen.add(name)
            if name in replace_files:
                with open(replace_files[name], "rb") as rf:
                    data = rf.read()
                out_info = zipfile.ZipInfo(name, date_time=info.date_time)
                out_info.compress_type = info.compress_type
                out_info.external_attr = info.external_attr
                zout.writestr(out_info, data, compress_type=info.compress_type)
            else:
                raw = zin.read(name)
                out_info = zipfile.ZipInfo(name, date_time=info.date_time)
                out_info.compress_type = info.compress_type
                out_info.external_attr = info.external_attr
                zout.writestr(out_info, raw, compress_type=info.compress_type)

        for name, cfg in add_files.items():
            if name in seen:
                continue
            with open(cfg["path"], "rb") as af:
                data = af.read()
            compress = zipfile.ZIP_STORED if cfg.get("stored") else zipfile.ZIP_DEFLATED
            zout.writestr(name, data, compress_type=compress)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
