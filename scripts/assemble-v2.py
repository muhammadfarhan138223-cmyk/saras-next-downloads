"""Assemble only the hash-pinned dev.8 release; leave it a draft."""
import hashlib,json,os,subprocess
from pathlib import Path
REPO=os.environ['GH_REPO']; TAG='v2.0.0-dev.8'
EXPECTED={'SARAS-Next-2.0.0-dev.8-Windows-x64-Setup.exe':(284038122,'8cfe79a123d54bc116c78195771db298d504180f17d10b5a4ebb59a02273b5f9'),'SARAS-Next-2.0.0-dev.8-Windows-x64-Update.zip':(299566241,'051fb3658b6b1a3a307294478887bf02e323bec65cd4b532e488f51e90c74cd3')}
def gh(*args): return subprocess.check_output(['gh',*args],text=True)
assert not json.loads(gh('repo','view',REPO,'--json','isPrivate'))['isPrivate']
release=next(r for r in json.loads(gh('api',f'repos/{REPO}/releases')) if r['tag_name']==TAG)
assert release['draft']
folder=Path('assembly');folder.mkdir()
gh('release','download',TAG,'--repo',REPO,'--pattern','v2-transfer.json','--pattern','v2-*.part','--dir',str(folder))
manifest=json.loads((folder/'v2-transfer.json').read_text());assert set(manifest)==set(EXPECTED)
for index,(name,(size,digest)) in enumerate(EXPECTED.items()):
    parts=manifest[name];assert 1<=len(parts)<=100
    output=folder/name
    with output.open('wb') as target:
        for n,part in enumerate(parts):
            assert part['name']==f'v2-{index}-{n:03}.part'
            data=(folder/part['name']).read_bytes()
            assert 0<len(data)<=8*1024*1024 and len(data)==part['bytes']
            assert hashlib.sha256(data).hexdigest()==part['sha256']
            target.write(data)
    assert output.stat().st_size==size
    with output.open('rb') as source: assert hashlib.file_digest(source,'sha256').hexdigest()==digest
    gh('release','upload',TAG,str(output),'--repo',REPO,'--clobber')
    remote=json.loads(gh('api',f'repos/{REPO}/releases/{release["id"]}'))
    asset=next(a for a in remote['assets'] if a['name']==name)
    assert asset['size']==size and asset['digest']=='sha256:'+digest
proof=folder/'github-v2-assembly-proof.json';proof.write_text(json.dumps({'passed':True,'artifacts':EXPECTED,'published':False},indent=2))
gh('release','upload',TAG,str(proof),'--repo',REPO,'--clobber')
