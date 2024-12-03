import os
import sys
import json
import subprocess
import platform

# if not enough arguments, print usage
if len(sys.argv) < 2:
	print("Usage: scpw <arg_file>")
	sys.exit(1)
 
# add -h flag for help
if sys.argv[1] == '-h':
	print("Usage: scpw <arg_file>")
	sys.exit(0)

arg_file = sys.argv[1]

# save user data to data.json, then can call processing.py
if platform.system() == 'Darwin':
	app_data_path = os.path.join('/Users', os.getenv('USER'), 'Library', 'Application Support', 'scpannotation')
elif platform.system() == 'Windows':
	app_data_path = os.path.join(os.getenv('LOCALAPPDATA'), 'scpannotation').replace('Local', 'Roaming')

settings_path = os.path.join(app_data_path, 'settings.json')
with open(settings_path, 'r') as f:
	settings = json.load(f)
 
storage_path = settings['storagePath']

# open arg file txt
with open(arg_file, 'r') as f:
	args = f.readlines()

# remove all text before ":root:" at each line (is just logging info)
args = [line[line.index(":root:")+6:] for line in args if ":root:" in line]

# keep only text between "***PARAMETERS USED***" and "***LOG***"
if "***PARAMETERS USED***\n" in args or "***LOG***\n" in args:
	args = args[args.index("***PARAMETERS USED***\n")+1:args.index("***LOG***\n")]

# strip endline
args = [line.strip() for line in args]

# write args to data.json
args_dict = {}
for line in args:
	key, value = line.split(" : ")
 
	# gets a bit tricky making sure value matches data.json
	# if is a list, keep it as a list, not a string
	# eval would be easier, but probably best to avoid
 
	# if value is a list of lists
	if value[0:2] == '[[':
		value = value[2:-2].split('], [')
		value = [[v.strip() for v in v.split(', ')] for v in value]
		value = [[v[1:-1] if v[0] == "'" else v for v in v] for v in value]
  
	# if value is a list
	elif value[0] == '[':
		if value == '[]':
			value = []
		else:
			value = value[1:-1].split(', ')
			value = [v.strip() for v in value]
			value = [v[1:-1] if v[0] == "'" else v for v in value]
	
	elif key == 'column-mismatches':
		# if column mismatches, ignore, unrealistic for to handle for CLI?
		value = {}
	
	args_dict[key] = value

# format same as data.json
data_dict = {}
data_dict['form'] = args_dict
 
with open(os.path.join(storage_path), 'w') as f:
	json.dump(data_dict, f)

# call processing.py
# cli.py should be in same file as processing.exe
if getattr(sys, 'frozen', False):
    # If the application is run as a bundle, the PyInstaller bootloader
    # extends the sys module by a flag frozen=True and sets the app
    processing_path = os.path.join(os.path.dirname(sys.executable), "processing")
else:
    processing_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "processing")

if platform.system() == 'Windows':
	processing_path += ".exe"

storage_path = os.path.normpath(storage_path)
processing_path = os.path.normpath(processing_path)

# check output dir exists, if not, create it
if not os.path.exists(args_dict['output-path']):
	os.makedirs(args_dict['output-path'])

# mac may need shell=True and text=True and input as list
result = subprocess.run(processing_path + " " + storage_path + " analysis", capture_output=True, shell=False)

# if error, print error
if result.returncode != 0:
	print("Error: " + result.stderr)
	sys.exit(1)
else:
	print("Output saved to : " + args_dict['output-path'])
