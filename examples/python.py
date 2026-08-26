import os, requests
result=requests.post(os.getenv("PROOFSCAN_URL","http://localhost:3000")+"/v1/verify",headers={"X-ProofScan-Key":os.environ["PROOFSCAN_API_KEY"]},json={"claim":"HTTP/3 is defined by RFC 9114.","evidence":"RFC 9114 defines HTTP/3, a mapping of HTTP semantics over QUIC."},timeout=20).json()
print(result)
