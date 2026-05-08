from urllib.request import urlopen
url = "https://raw.githubusercontent.com/abraxass0511-lab/INFJ-s-wiki/main/00_Raw/2026-05-08/%ED%85%8C%EC%8A%A4%ED%8A%B82.md"
content = urlopen(url).read().decode("utf-8")
print(content)
