import json
import os
import urllib.request

url = "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
sfJson = "soundfont.json"
insJson = "instrument.json"
sfUrl = url+"/"+sfJson
errorMessages = []

if not os.path.exists(sfJson):
	print(sfUrl)
	urllib.request.urlretrieve(sfUrl, sfJson)

with open(sfJson) as sfData_file:    
    sfData = json.load(sfData_file)

for key, value in sfData["instruments"].items():
	if not os.path.exists(value):
		os.mkdir(value)

	insPath = os.path.join(value, insJson)
	if not os.path.exists(insPath):
		insUrl = url+"/"+value+"/"+insJson
		print(insUrl)
		urllib.request.urlretrieve(insUrl, insPath)
	
	with open(insPath) as insData_file:
		insData = json.load(insData_file)

		minPitch = insData["minPitch"]
		maxPitch = insData["maxPitch"]
		velocities = insData["velocities"]

		for i in range(minPitch, maxPitch):
			for j in range(0, len(velocities)):
				sampleName = "p" + str(i) + "_v" + str(velocities[j]) + ".mp3"
				samplePath = os.path.join(value, sampleName)
				if not os.path.exists(samplePath):
					sampleUrl = url+"/"+value+"/"+sampleName
					print(sampleUrl)
					try:
						urllib.request.urlretrieve(sampleUrl, samplePath)	
					except:
						msg = "Error downloading " + sampleUrl
						print(msg)			
						errorMessages.append(msg)

print("Download completed with " + str(len(errorMessages)) + " errors.")

for msg in errorMessages:
	print(msg)



