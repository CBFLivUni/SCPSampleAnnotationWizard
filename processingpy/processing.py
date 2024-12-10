import os
import sys
import time
import warnings
# suppress FutureWarnings to keep cli cleaner
warnings.simplefilter(action='ignore', category=FutureWarning)

import pandas as pd
import string
import csv
import numpy as np
import matplotlib.pyplot as plt
import matplotlib
import PyQt5
import math
import json
import logging
import re

matplotlib.use('Qt5Agg')

"""
run processing of data from UI imports, based on 'CellenONE_ImportSinglePickup_AR.m'
"""

# adaption of CellenONE_ImportSinglePickup.m
# MATLAB file written by Ed Emmott, adapted and translated to Python by Alex Rothwell

# TODO
# could do with tidying up and breaking into multiples files now that it's grown, challenge to integrate with pyinstaller

try:
	# get all imports and options from ui
	# process and tidy args.

	# get user_data_path as arg
	user_data_path = sys.argv[1]

	# either 'processimport', 'full'
	analysis = sys.argv[2]
	#analysis ='f'

	with open(user_data_path, "r") as read_file:
		user_data = json.load(read_file)

	# define paths
	file_format = user_data['form']['file-format']
	rawfile_p_f = user_data['form']['raw-files-group']
	rawfile_path = user_data['form']['raw-files-path']
	labels_path = user_data['form']['label-file-path']
	pickup_path = user_data['form']['pickup-file-path']
	cell_files = user_data['form']['cell-files-path']
	output_path = user_data['form']['output-path']
	extra_rows = user_data['form']['extra-rows']
	well_to_tmt_mapping = user_data['form']['well-to-tmt-mapping']
	tmt_mapping_path = user_data['form']['tmt-mapping-path']
	cell_names = user_data['form']['cell-population-names']
 
	# when using CLI, meta data not added because too fiddly, so just include all cols
	if 'meta-to-include' in user_data['form']:
		meta_to_include = user_data['form']['meta-to-include']
	else:
		meta_to_include = []
  
	column_mismatches = user_data['form']['column-mismatches']
	label_missing = user_data['form']['label-missing-data']
	well_regex = user_data['form']['well-regex']
	pickup_type = user_data['form']['pickup-type']
	offset = user_data['form']['offset']
	tech = user_data['form']['tech-type']
	invert_col = user_data['form']['invert-col']
	invert_row = user_data['form']['invert-row']
	col_regex = user_data['form']['col-regex']
	row_regex = user_data['form']['row-regex']
	extra_cellone_files = user_data['form']['extra-cellone-files']

	# if file-format is "d", then force "raw-files-group" to be "csv"
	if file_format == "d":
		rawfile_p_f = "csv"

	# set up logging asap
	logging.basicConfig(filename= os.path.join(output_path, "scpannotationwizard.log"), level=logging.INFO)

	# if just for processing import data to populate metadata page
	if analysis == 'processimport':

		logging.info("Processing Imports")

		# get columns and mismatch data to include in metadata page
  
		f_to_col = {}  # which cols are in which files
		columns = []
		logging.info(cell_files)
		for i, f in enumerate(cell_files):
			if f.endswith('csv'):
				f_df = pd.read_csv(f, sep=",")
			elif f.endswith('.xls'):
					# '.xls' files straight from the machine are actually tsv's with xls extension.
					f_df = pd.read_csv(f, sep="\t").dropna(axis='columns')
			else:
				logging.error("Check '" + str(f) + "' is valid .csv or .xls Cell File")
				sys.exit("Check '" + str(f) + "' is valid .csv or .xls Cell File")
			curr_cols = [c.strip() for c in list(f_df.columns)]  # strip any whitespace
			columns = columns + curr_cols
			# parse string regardless of platform
			if "/" in f:
				f_to_col[f.split("/")[-1]] = curr_cols
			elif "\\" in f:
				f_to_col[f.split("\\")[-1]] = curr_cols

		unique_cols = list(set(columns))

		# default cols, plus cell file cols
		unique_cols.sort()  # sort alphabetically
		if tech == "tmt":
			cols_to_show = ['RawFileName', 'Channel', 'CellType'] + unique_cols
		else :
			cols_to_show = ['RawFileName', 'CellType'] + unique_cols

		# add to json
		user_data['private']['meta-data-array'] = cols_to_show
		logging.info("Adding cols to show to JSON")
		logging.info("Cols to show : " + str(cols_to_show))

		user_data['private']['column-mismatches-json'] = f_to_col
		logging.info("Adding column mismatches to show to JSON")
		logging.info("Cols and headers : " + str(f_to_col))

		# get example raw file name
		if rawfile_p_f == 'folder':

			for f in os.listdir(rawfile_path):
				if f.endswith(".raw") or f.endswith(".d"):
					example_raw_file = f
					break  # end loop once found a suitable example raw file

		elif rawfile_p_f == 'csv':

			# expects first col needs to be data, second aquistime, as in README template
			try:
				raw_files_df = pd.read_csv(rawfile_path)
				example_raw_file = raw_files_df.iloc[0, 0]
			except FileNotFoundError as e:
				logging.error("Check '" + str(rawfile_path) + "' is valid Raw File Import .csv, see README.xlsx for guidance")
				sys.exit("Check '" + str(rawfile_path) + "' is valid Raw File Import .csv, see README.xlsx for guidance")

		user_data['private']['example-raw-f'] = example_raw_file

		with open(user_data_path, "w") as write_file:
			json.dump(user_data, write_file)

		sys.exit(0)

	# full processing is run
	else:
		# preprocess and sanitise inputs
		# get only column names to include meta_data  
		cols_to_include = []
  
		if meta_to_include != []:
		# if meta_to_include is empty, then include all columns
			for col in meta_to_include:
				if col['checked'] == True:
					cols_to_include.append(col['name'])

		if tech == "tmt":
			if well_to_tmt_mapping == "default":
				# find path of default csv
				if getattr(sys, 'frozen', False):
					# get path of pyinstaller.exe
					# If the application is run as a bundle, the PyInstaller bootloader
					# extends the sys module by a flag frozen=True and sets the app 
					# path into variable _MEIPASS'.
					dir_path = os.path.dirname(sys.executable)
				else:
					dir_path = os.path.dirname(os.path.abspath(__file__))
				logging.info('processing.exe path: ' + dir_path)
				try:
					tmt_mapping_xl = pd.read_csv(os.path.join(dir_path, 'WelltoLabelmappingDefault.csv'))
				except FileNotFoundError as e:
					logging.error("Default file '" + str(os.path.join(dir_path, 'WelltoLabelmappingDefault.csv')) + "' not found report to development team")
					sys.exit("Default file '" + str(os.path.join(dir_path, 'WelltoLabelmappingDefault.csv')) + "' not found report to development team")

			else:
				try:
					tmt_mapping_xl = pd.read_csv(tmt_mapping_path)
				except FileNotFoundError as e:
					logging.error("Check '" + str(tmt_mapping_path) + "' is valid Well to Label mapping .csv, see README.xlsx for guidance")
					sys.exit("Check '" + str(tmt_mapping_path) + "' is valid Well to Label mapping .csv, see README.xlsx for guidance")

			# if additional rows on csv that are empty, then delete them to ensure not filled
			tmt_mapping_xl = tmt_mapping_xl.dropna(axis = 0, how = 'all')
			# convert nan to string, easier to deal with
			tmt_mapping_xl = tmt_mapping_xl.fillna(label_missing)

			tmt_mapping = {}

			# create dict mapping, if multiple values per key, then turn into list, so can be looped over later
			for idx, row in tmt_mapping_xl.iterrows():
				if row['Well'] in tmt_mapping.keys():

					# turn to list if not already list
					if type(tmt_mapping[row['Well']]) is list:
						tmt_mapping[row['Well']].append(row['Label'])

					else:
						tmt_mapping[row['Well']] = [tmt_mapping[row['Well']], row['Label']]

				else:
					tmt_mapping[row['Well']] = row['Label']

		# return the form data to the user, not the private data, that is used for the app
		user_settings = user_data['form']

		# clear out anything don't need
		if 'meta-to-include' in user_settings:
			del user_settings['meta-to-include']
		user_settings['cols_to_include'] = cols_to_include

		# log params
		logging.info("***PARAMETERS USED***")
		[logging.info(str(param[0]) + " : " + str(param[1])) for param in user_data['form'].items()]
		logging.info("***LOG***")

		# raw files
		# get file name and msaquisdatetime, either from csv or folders with .raw or .d
		# switch for rawfile path or csv with list of rawfiles
		# 'folder' for path of folder containing raw files or 'csv' for csv with file list
		# if rawfile path is input, then import from path
		if rawfile_p_f == 'folder':

			# get raw files
			raw_files = []
			creation_times = []

			for f in os.listdir(rawfile_path):
				if f.endswith(".raw") or f.endswith(".d"):
					raw_files.append(f)
					creation_times.append(
							time.ctime(os.path.getmtime(os.path.join(rawfile_path, f)))
							)
			
			raw_files_df = pd.DataFrame(data={"RawFileName": raw_files, "MSAquisDateTime": creation_times})

		elif rawfile_p_f == 'csv':

			# expects first col needs to be data, second aquistime, as in README template
			try:
				raw_files_df = pd.read_csv(rawfile_path)
			except FileNotFoundError as e:
				logging.error("Check '" + str(rawfile_path) + "' is valid Raw File Import .csv, see README.xlsx for guidance")
				sys.exit("Check '" + str(rawfile_path) + "' is valid Raw File Import .csv, see README.xlsx for guidance")

		# invert col and row if needed
		if invert_col == "true":
			# get all col numbers from raw files
			col_numbers = []
			for raw_file in raw_files_df['RawFileName']:
				match = re.search(col_regex, raw_file)
				if match:
					col_numbers.append(int(match.group(1)))

			# invert column numbers
			unique_col_numbers = list(set(col_numbers))
			sort_unique_col_numbers = sorted(unique_col_numbers)
			reverse_unique_col_numbers = sort_unique_col_numbers[::-1]

			# convert to str so can add leading zero if single digit
			sort_unique_col_numbers_str = [str(x) if len(str(x)) == 2 else "0" + str(x) for x in sort_unique_col_numbers]
			reverse_unique_col_numbers_str = [str(x) if len(str(x)) == 2 else "0" + str(x) for x in reverse_unique_col_numbers]
   
			inverted_col_dict = dict(zip(sort_unique_col_numbers_str, reverse_unique_col_numbers_str))

			# update raw file names with inverted column numbers
			new_raw_file_names = []
			for raw_file in raw_files_df['RawFileName']:
				# replace using dict and regex
				to_replace = re.search(col_regex, raw_file).group(1)
				replace_with = inverted_col_dict[to_replace]
    
				new_raw_file_name = re.sub(col_regex, f'_C{replace_with}_', raw_file)
    
				new_raw_file_names.append(new_raw_file_name)

			raw_files_df['RawFileName'] = new_raw_file_names
   
		if invert_row == "true":
			# get all row numbers from raw files
			row_numbers = []
			for raw_file in raw_files_df['RawFileName']:
				match = re.search(row_regex, raw_file)
				if match:
					row_numbers.append(int(match.group(1)))
     
			# invert row numbers
			unique_row_numbers = list(set(row_numbers))
			sort_unique_row_numbers = sorted(unique_row_numbers)
			reverse_unique_row_numbers = sort_unique_row_numbers[::-1]
   
			# convert to str so can add leading zero if single digit
			sort_unique_row_numbers_str = [str(x) if len(str(x)) == 2 else "0" + str(x) for x in sort_unique_row_numbers]
			reverse_unique_row_numbers_str = [str(x) if len(str(x)) == 2 else "0" + str(x) for x in reverse_unique_row_numbers]
   
			inverted_row_dict = dict(zip(sort_unique_row_numbers_str, reverse_unique_row_numbers_str))

			# update raw file names with inverted row numbers
			new_raw_file_names = []
			for raw_file in raw_files_df['RawFileName']:
				# replace using dict and regex
				to_replace = re.search(row_regex, raw_file).group(1)
				replace_with = inverted_row_dict[to_replace]
	
				new_raw_file_name = re.sub(row_regex, f'_R{replace_with}_', raw_file)
	
				new_raw_file_names.append(new_raw_file_name)
    
			raw_files_df['RawFileName'] = new_raw_file_names

		# from raw files, naming convention for assigning PickupWell quite confusing, check it makes sense.
		# col 1 is A, 2 is B, 3 is C etc.
		# row 1 is 1, 2 is 2, 3 is 3 etc.
		# assume naming convention row 'SH230524_F1_C03_R04_S0006_S2.raw'

		pickup_well = []

		for idx, row in raw_files_df.iterrows():
			# get well from raw file name
			new_well = str(re.search(well_regex, row['RawFileName']).group(1))
			pickup_well.append(new_well)

		raw_files_df['PickupWell'] = pickup_well

		if labels_path.endswith('.fld'):
			# also digest path for if doing label free analysis
			# process as fld
			# csv module better for reading dodgy text files
			# only keep rows which contain full values
			full_rows = []

			try:
				with open(labels_path, encoding="Windows-1252") as labels_tsv:
					rd = csv.reader(labels_tsv, delimiter="\t", quotechar='"')
					for row in rd:
						# if any elements are empty then don't keep row, or not 3 cols
						if ('' not in row) and (len(row)==3):
							full_rows.append(row)
			except FileNotFoundError as e:
				logging.error("Check '" + str(labels_path) + "' is valid labels .fld, see README.xlsx for guidance")
				sys.exit("Check '" + str(labels_path) + "' is valid labels .fld, see README.xlsx for guidance")
			
			# to dataframe
			labels_df = pd.DataFrame(full_rows, columns = ['position', 'well', 'volume'])
			labels_df['xpos'] = labels_df['position'].map(lambda x: x.split('/')[1])
			labels_df['ypos'] = labels_df['position'].map(lambda x: x.split('/')[0])

			# point at which ypos decreases, then new field
			
			field = 1
			field_list = []
			for idx, row in labels_df.iterrows():
				if idx == 0:
					# if first row, then set field to 1
					field_list.append(field)
					prev_ypos = int(row['ypos'])
				
				else:
					curr_ypos = int(row['ypos'])

					# if current ypos is less than previous, then onto the next field.
					if curr_ypos < prev_ypos:
						field += 1

					field_list.append(field)

					# record what previous ypos will then be
					prev_ypos = curr_ypos

			labels_df['field'] = field_list
		
		else:
			logging.error("Labels file must be .fld")
			sys.exit("Labels file must be .fld")

		# pickup file processing
		if pickup_path.endswith(('.csv', '.log')):
			# both csv and log file can be open this way, even though uses csv reader
			# just different delimiter
			if pickup_path.endswith('.csv'):
				delimiter = ","
			elif pickup_path.endswith('.log'):
				delimiter = "\t"
		
			full_rows = []

			try:
				with open(pickup_path, encoding="Windows-1252") as pickup_csv:
					rd = csv.reader(pickup_csv, delimiter=delimiter, quotechar='"')
					for row in rd:
						# if any elements are empty then don't keep row, or not 3 cols
						# only keep if first 10 ele's in list arne't empty.
						if all([r != '' for r in row[:11]]):
							full_rows.append(row[:11])
			except FileNotFoundError as e:
				logging.error("Check '" + str(pickup_path) + "' is valid pickup .csv or .log, see README.xlsx for guidance")
				sys.exit("Check '" + str(pickup_path) + "' is valid pickup .csv or .log, see README.xlsx for guidance")

			pickup_df = pd.DataFrame(full_rows, columns = ['Time', 'Plate','Plate_Pos','Nozzle',
														'Well','Target','Level','Field','Drops',
														'XPos','YPos'])
			
			# if field not in labels df, then probably not real value, drop
			legit_field_val = labels_df['field'].unique()
			# first convert to str
			legit_field_val = [str(x) for x in legit_field_val]

			pickup_df = pickup_df[pickup_df['Field'].isin(legit_field_val)]
			pickup_df = pickup_df.apply(pd.to_numeric, errors='ignore')
			# handle dual pickup
			# same pickup values again + offset on XPos, and +2 chars on Well ie. (A1 -> C1)
			if pickup_type == "dual":
				dual_pickup_df = pickup_df.copy()
				dual_pickup_df['XPos'] += int(offset)
				# + 2 chars in index of current chars and include row
				dual_pickup_df['Well'] = dual_pickup_df['Well'].map(lambda x: string.ascii_letters[string.ascii_letters.index(x[0]) + 2] + x[1:])
				pickup_df = pd.concat([pickup_df, dual_pickup_df])

		else:
			logging.error("Pickup file must be .csv or .log")
			sys.exit("Pickup file must be .csv or .log")
			
		# process cell files
		# just reading files, then concatenating, assumes that indexes for cell_files and cell_names is the same

		cell_files_list = []

		for i, f in enumerate(cell_files):
			try:
				if f.endswith('.csv'):
					f_df = pd.read_csv(f, sep=",")

				elif f.endswith('.xls'):
					# '.xls' files straight from the machine are actually tsv's with xls extension.
					f_df = pd.read_csv(f, sep="\t").dropna(axis='columns')

				# will already have thrown error during processing imports if there's an error with cell files, so don't 
				# need to check if file type is anything other than these.
			except FileNotFoundError:
				logging.error("Cell files must be .csv or .xls")
				sys.exit("Cell files must be .csv or .xls")
			# some of the test files had trailing whitespace in the column names which caused issues, remove
			f_df = f_df.rename(columns=lambda x: x.strip())
			f_df['CellType'] = cell_names[i]
			f_df['CellSortFile'] = f
			cell_files_list.append(f_df)

		cell_files_df = pd.concat(cell_files_list)

		# add additional annotion files
		if len(extra_cellone_files) != 0:
      
			# list of extra df to include
			extra_dfs = []
			
			# format files
			extra_files_dict = {}
			for file in extra_cellone_files:
       
				if file[0] != "No file imported":
					extra_files_dict[file[0]] = file[1]
				else:
					logging.error(f"Extra file '{file[0]}' not imported")
					sys.exit(f"Extra file '{file[0]}' not imported")
     
			# add columns
			for f_label, f_path in extra_files_dict.items():
				if f_path.endswith('.fld'):
        
					full_rows = []
        
					try:
						# process in the same way as labels.fld files
						with open(f_path, encoding="Windows-1252") as extra_file_tsv:
							rd = csv.reader(extra_file_tsv, delimiter="\t", quotechar='"')
							for row in rd:
								# if any elements are empty then don't keep row, or not 3 cols
								if ('' not in row) and (len(row)==3):
									full_rows.append(row)
         
					except FileNotFoundError as e:
						logging.error("Check '" + str(f_path) + "' is valid .fld, see README.xlsx for guidance")
						sys.exit("Check '" + str(f_path) + "' is valid .fld, see README.xlsx for guidance")
      
					# to dataframe
			extra_rows_df = pd.DataFrame(full_rows, columns = ['position', 'well', 'volume'])
			extra_rows_df['xpos'] = extra_rows_df['position'].map(lambda x: x.split('/')[1])
			extra_rows_df['ypos'] = extra_rows_df['position'].map(lambda x: x.split('/')[0])

			# 'volume' column is the column that we need to add to the final table
			# matched to xpos, ypos
			
			field = 1
			field_list = []
			for idx, row in extra_rows_df.iterrows():
				if idx == 0:
					# if first row, then set field to 1
					field_list.append(field)
					prev_ypos = int(row['ypos'])
				
				else:
					curr_ypos = int(row['ypos'])

					# if current ypos is less than previous, then onto the next field.
					if curr_ypos < prev_ypos:
						field += 1

					field_list.append(field)

					# record what previous ypos will then be
					prev_ypos = curr_ypos

			extra_rows_df['field'] = field_list
			extra_rows_df['XY'] = extra_rows_df.apply(lambda x : str(x['field']) + "_" + str(x['xpos']) + "_" + str(x['ypos']), axis=1)
			# keep onlt volume and XY
			extra_rows_df = extra_rows_df[['XY', 'volume']]

			# if volume column ends in ',' then remove
			extra_rows_df['volume'] = extra_rows_df['volume'].map(lambda x: x.rstrip(','))

			# if f_label is the same as a column name, then add "_cellone" to avoid conflict
			if f_label in labels_df.columns or f_label in cell_files_df.columns:
				old_f_label = f_label
				f_label += "_cellone"
    
				# update dict with new column name so that it is added correctly later on
				extra_files_dict[f_label] = f_path
				del extra_files_dict[old_f_label]

      		# rename volume to match label      
			extra_rows_df = extra_rows_df.rename(columns={'volume': f_label})
   
			extra_dfs.append(extra_rows_df)
		
		else:
			logging.error("Additional annototation file must be .fld")
			sys.exit("Additional annototation file must be .fld")

		# handle mismatches
		for col, val in column_mismatches.items():
			# if input is to remove, then remove col
			if val['handle'] == "remove":
				cell_files_df = cell_files_df.drop(columns=[col])

			elif val['handle'] == "fill":
				cell_files_df = cell_files_df[col].fillna(val['fillValue'])

		# labels and cell files, combined X_Y field to help with matching
		cell_files_df['XY'] = cell_files_df.apply(lambda x : str(x['Field']) + "_" + str(x['XPos']) + "_" + str(x['YPos']), axis=1)
		labels_df['XY'] = labels_df.apply(lambda x : str(x['field']) + "_" + str(x['xpos']) + "_" + str(x['ypos']), axis=1)

		# merge labels and cell tables
		merged_table_df = labels_df.merge(cell_files_df, on='XY', how="outer")
		merged_table_df = merged_table_df.apply(pd.to_numeric, errors='ignore')
  
		# if extra files, then merge them
		if len(extra_dfs) != 0:
			for extra_df in extra_dfs:
				merged_table_df = merged_table_df.merge(extra_df, on='XY', how="outer")

		# fill empties
		merged_table_df['CellType'] = merged_table_df['CellType'].fillna(label_missing)
		merged_table_df['CellSortFile'] = merged_table_df['CellSortFile'].fillna(label_missing)

		# loop over fields from merged_table
		# get x and y positions from pickup
		pickup_x = []
		pickup_y = []
		pickup_plate = []
		pickup_well = []

		# sometimes label file points to coords that were not actually used, keep only fields that were actually used from labels file
		# assumes whole fields are always used and empties are controls
		field_used = pickup_df['Field'].unique()
		# note uses lowercase "field" which is from labels file
		merged_table_df = merged_table_df[merged_table_df['field'].isin(field_used)]

		for idx, row in merged_table_df.iterrows():

			# check does exist and not na
			if ~np.isnan(row['XPos']):
				# xy coords from merged table
				field = row['field']  # only allow pickup searching within current field
				coords_merged = row[['XPos', 'YPos']].to_numpy()
			
				pickup_cols_to_match = pickup_df[pickup_df['Field'] == field][['XPos', 'YPos', 'Well', 'Plate']]

				# x y coords from pickup
				all_coords_pickup_field = pickup_cols_to_match[['XPos', 'YPos']].to_numpy()

				# find closest pickup coords to table
				# calc euclidean distance 
				# https://stackoverflow.com/a/1401828/10905324
				dist = np.array([np.linalg.norm(coord_pickup - coords_merged) for coord_pickup in all_coords_pickup_field])
				closest_pickup = pickup_cols_to_match.iloc[dist.argmin(), :]  # idx of smallest distance to pickup
				pickup_x.append(closest_pickup['XPos'])
				pickup_y.append(closest_pickup['YPos'])
				pickup_well.append(closest_pickup['Well'])
				pickup_plate.append(closest_pickup['Plate'])
			
			else:  # if is na, add as na
				pickup_x.append(np.nan)
				pickup_y.append(np.nan)
				pickup_plate.append(np.nan)
				pickup_well.append(np.nan)

		merged_table_df['PickupXpos'] = pickup_x
		merged_table_df['PickupYpos'] = pickup_y
		merged_table_df['PickupWell'] = pickup_well
		merged_table_df['PickupPlate'] = pickup_plate

		# calc deviation between x and y and pickup
		merged_table_df['DevX'] = merged_table_df.apply(lambda x: x['XPos'] - x['PickupXpos'], axis=1)
		merged_table_df['DevY'] = merged_table_df.apply(lambda x: x['YPos'] - x['PickupYpos'], axis=1)

		# scatter plots of pickup and XY coords
		#plt.scatter(merged_table_df['DevX'], merged_table_df['DevY'])

		fields = merged_table_df['Field'].dropna().sort_values().unique()

		N_COLS = 2
		n_rows = math.ceil(len(merged_table_df['Field'].dropna().unique()) / N_COLS)

		for i, field in enumerate(fields):

			# subplot for each field
			plt.subplot(n_rows, N_COLS, i+1)
			plt.title("Field " + str(int(field)))

			# plot real pos's
			plt.scatter(merged_table_df[merged_table_df['Field'] == field]['XPos'],
							-merged_table_df[merged_table_df['Field'] == field]['YPos'],
							c='red')

			# plot pickup pos
			plt.scatter(merged_table_df[merged_table_df['Field'] == field]['PickupXpos'],
						-merged_table_df[merged_table_df['Field'] == field]['PickupYpos'],
						c='black')
			
			# plot lines between pickup and real pos
			for idx, row in merged_table_df[merged_table_df['Field'] == field].iterrows():
				plt.plot([row['PickupXpos'], row['XPos']],
						[-row['PickupYpos'], -row['YPos']],
						c='black')
			
		plt.tight_layout()
		plt.savefig(os.path.join(output_path, "pickup_matching_field_plot.png"), dpi=300)

		# Join that table with rawfiles
		merged_table_df = merged_table_df.merge(raw_files_df, on='PickupWell', how="inner")

		# then format channels to match SCP package
		# match well to tmt mapping name, using TMT mapping file and include the offset that changes per set
		if tech == "tmt":
			tmtRInames = []
			for idx, row in merged_table_df.iterrows():
				tmtRInames.append(tmt_mapping[row['well']])

			# TODO IF LABEL FREE DON'T KNOW WHAT CHANNEL SHOULD BE SET AS?
			# just call Channel here, as that is what is ultimately formatted as
			merged_table_df['Channel'] = tmtRInames

		# add new row for each RawFile
		unique_raw_files = merged_table_df['RawFileName'].unique()

		# put extra rows in a df to concat at the end
		# slightly faster
		extra_rows_df = pd.DataFrame(columns=merged_table_df.columns)

		for file in unique_raw_files:

			# get time for that raw file
			# if no values present return np.nan
			if len(merged_table_df[merged_table_df['RawFileName'] == file]) == 0:
				aquis_date_time = np.nan

			else:
				aquis_date_time = merged_table_df[merged_table_df['RawFileName'] == file]['MSAquisDateTime'].values[0]

			for row in extra_rows:

				# if tmt, then add Channel as well
				if tech == "tmt":

				# throw exception if extra row does not have TMT mapping
					try:
						tmt_mapping[row]
					except KeyError as e:
						logging.error("Extra row : '" + row + "' does not have a Label mapping. Each extra row \
			must also contain a mapping in the Label mapping file")
						raise Exception("Extra row : '" + row + "' does not have a Label mapping. Each extra row \
			must also contain a mapping in the Label mapping file")
						sys.exit(e)

					# if multiple values to a mapping, then it's an array, so loop over, else is just str
					if type(tmt_mapping[row]) is str:
						row_for_df = {'RawFileName': file,
								'MSAquisDateTime': aquis_date_time,
								'CellType': row,
								'Channel': tmt_mapping[row]}
						
						extra_rows_df = pd.concat([extra_rows_df, pd.DataFrame(row_for_df, index=[0])])
					
					elif type(tmt_mapping[row]) is list:
						for ele in tmt_mapping[row]:
							row_for_df = {'RawFileName': file,
								'MSAquisDateTime': aquis_date_time,
								'CellType': row,
								'Channel': ele}
					
							extra_rows_df = pd.concat([extra_rows_df, pd.DataFrame(row_for_df, index=[0])])
						
				else:
					# if label free, then don't add channel
					row_for_df = {'RawFileName': file,
								'MSAquisDateTime': aquis_date_time,
								'CellType': row}
					extra_rows_df = pd.concat([extra_rows_df, pd.DataFrame(row_for_df, index=[0])])

				
		# add extra rows to df
		final_df = pd.concat([merged_table_df, extra_rows_df])

		# if any reporters, not accounted for per rawfile, then add as missing value (usually control)
		# assumes all reporters are always used across files, but sometimes may be specific in mapping csv
		if tech == "tmt":

			missing_reporter_rows_df = pd.DataFrame(columns=merged_table_df.columns)

			unique_reporters = tmt_mapping_xl['Label'].unique()

			for r in unique_raw_files:
				df_for_raw = final_df[final_df['RawFileName'] == r]

				aquis_date_time = df_for_raw['MSAquisDateTime'].values[0]

				# get reporters that aren't currently present for that raw file 
				missing_for_raw = list(set(unique_reporters).difference(df_for_raw['Channel']))

				if len(missing_for_raw) != 0:
					for rep in missing_for_raw:

						row_for_df = {'RawFileName': r,
								'MSAquisDateTime': aquis_date_time,
								'CellType': label_missing,
								'Channel': rep}
						
						missing_reporter_rows_df = pd.concat([missing_reporter_rows_df, pd.DataFrame(row_for_df, index=[0])])

			# add extra rows to df
			final_df = pd.concat([final_df, missing_reporter_rows_df])

		# then final table cleanup
		if tech == "tmt":
			final_df = final_df.sort_values(by=['RawFileName', 'Channel'])
		else:
			final_df = final_df.sort_values(by=['RawFileName'])

		# only keep columns you need
  		# if cols_to_include is empty, then keep all columns
		if cols_to_include != []:
			final_df = final_df[cols_to_include + list(extra_files_dict.keys())]

		# if nan's deal with
		final_df['RawFileName'] = final_df['RawFileName'].map(lambda x: str(x).split('.raw')[0])
		final_df['RawFileName'] = final_df['RawFileName'].map(lambda x: str(x).split('.d')[0])

		# make it easier for downstream analysis
		final_df.rename(columns={"RawFileName": "runCol", "Channel": "quantCols"}, inplace=True)
		final_df['num'] = final_df['quantCols'].str.extract(r'\.(\d+)$')[0].astype(float)
		final_df = final_df.sort_values(by=['runCol', 'num'])
		final_df.drop(columns=['num'], inplace=True)

		# write table
		try:
			final_df.to_csv(os.path.join(output_path, "scp_sample_annotation_table.csv"), index=False)
		except PermissionError as e:
			logging.error("Ensure that '" + str(os.path.join(output_path, "scp_sample_annotation_table.csv")) + "' is not open")
			sys.exit(e)

	# regardless of analysis run
	logging.shutdown()

	# send data back to nodejs
	sys.stdout.flush()
 
except Exception as e:
	logging.error(e)

	# send data back to nodejs
	sys.stdout.flush()