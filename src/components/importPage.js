import * as React from 'react';
import { useState, setState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { handleChangePF, setUpStoreObj } from './processForm';
import { handleProcessImports } from './processImports';
import { getValuesToPopulatePage, processAdditionalArgs } from './populatePages';
import Zoom from '@mui/material/Zoom';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

import { Link } from "react-router-dom";

import Item from '../components/Item';

function ImportPage() {

  // get store object to pass around for each page, rather than set up each time handleChange called
  const store = setUpStoreObj();

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = processAdditionalArgs('storagePath');

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

  // when folder radio button is selected, allow selection of directory, when csv, allow file
  // set correct defaults
  var defAllowDir = "true";
  var defRawText = "Select Folder";
  if (currVars['form']['raw-files-group'] === "csv") {
    defAllowDir = "false";
    defRawText = "Select File"
  }

  const [allowDir, setDir] = React.useState(defAllowDir);
  const [selectRawText, setRawText] = React.useState(defRawText);

  const handleFolderSet = (e) => {

    if (e.target.value === "csv") {

    // when csv set only allow ind files selected
    // when folder set allow dirs to be selected
    //if (allowDir === "true") {
      // as long as valid string, webkitdir will be set as true, if not valid string, then will be set as false
      // hence mixed types
      setDir(false)
      setRawText("Select File")
    } else {
      setDir("true")
      setRawText("Select Folder")
    }
  };

  // check if name already exists in form i.e. return from prev page
  var defTaskName = "";
  if (currVars['private']['name-job']  !== "undefined") {
    defTaskName = currVars['private']['name-job'];
  }
  const [sanText, setText] = React.useState(defTaskName);

  function sanitiseText(value) {
    // sanitise task name so is safe as folder

    const regex = /^[a-z0-9]+$/i;
    if (value === '' || regex.test(value)) {
      setText(value);

      // and trigger event to save
      var event = {
        target: {
          name: "name-job",
          value: value
        }
      };
      handleChangePF(event, store, storagePath)
    }
  }

  const [hideRadio, radioGroupDisplay] = React.useState();

  function handleExtensionChange(e) {
    // when extension changes, set value to csv and grey out folder option
    console.log(e.target.value);
    if (e.target.value === "raw") {
      radioGroupDisplay();  // don't hide radio group, just use default

      // as raw been selected, check what settings were before and use them
      // horrible way to do this, can't find easier way.
      document.getElementsByName("raw-files-group").forEach(function(radio) {
        if (radio.checked) {
          if (radio.value === "folder") {
            setDir(true)
            setRawText("Select Folder")
          } else {
            setDir(false)
            setRawText("Select File")
          }
        }
      });

    } else {
      // if .d then hide radio group and set csv options, ie. select one file
      radioGroupDisplay("none");

      // force making sure can only select csv
      //setDir(false)
      //setRawText("Select File")
      handleFolderSet({target: {value: "csv"}})
      
    }
  }

  const [LabelInputName, setLabelName] = React.useState("Labels file");

  function handleTechChange(e) {
    if (e.target.value === "tmt") {
      setLabelName("Labels file")
    } else {
      setLabelName("Droplet location file")
    }
  }

  // additional files

  // TODO -  this just sets the state to blank when go back to that page, ideally would take state from json, but would need some refactoring
  // and no validation of form filled out properly
  // don't check that column names are already used
  const [rows, setRows] = useState([]);

  function handleSubmitER(e){
    e.preventDefault()
    setRows([...rows, ''])
  }

  function handleDeleteER(index){
    const newRows = [...rows]
    newRows.splice(index, 1)
    setRows(newRows)
  }

  return(
    <div className="App">
          <header className="App-header">
            <h1 className="page-title">Import</h1>
            <FormControl
            onChange={(event) => handleChangePF(event, store, storagePath)}>
              <Box sx={{ flexGrow: 1 }}>
                  <Grid container direction="column" className="outer-grid-layout" spacing={1}>
                  <Grid item>
                  <Item>
                  <Tooltip 
                          TransitionComponent={Zoom}
                          title="Select the technology used to generate data"
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2 className='import_first_col'>Technology used</h2>
                          <FormLabel style={{'marginLeft': '0px'}} id="raw-files-csv-or-folder-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="raw-files-csv-or-folder-label"
                            defaultValue={currVars.form["tech-type"]}
                            name="tech-type"
                            className='import_second_col'>
                            <FormControlLabel onChange={handleTechChange} value="tmt" control={<Radio />} label="Label-based" />
                            <FormControlLabel onChange={handleTechChange} value="label-free" control={<Radio />} label="Label-free" />
                          </RadioGroup>
                          </Stack>
                      </Tooltip>
                  </Item>
                  </Grid>
                  <Grid item>
                  <Item>
                  <Tooltip 
                          TransitionComponent={Zoom}
                          title="Select the type of data used"
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2 className='import_first_col'>Data File Extension</h2>
                          <FormLabel style={{'marginLeft': '0px'}} id="raw-or-d-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="raw-or-d-label"
                            defaultValue={currVars.form["file-format"]}
                            name="file-format"
                            className='import_second_col'>
                            <FormControlLabel onClick={(e) => handleExtensionChange(e)} value="raw" control={<Radio />} label=".raw"/>
                            <FormControlLabel onClick={(e) => handleExtensionChange(e)} value="d" control={<Radio />} label=".d" />
                          </RadioGroup>
                          </Stack>
                      </Tooltip>
                  </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                          <Tooltip 
                          TransitionComponent={Zoom}
                          title="Import either folder containing '.raw' files or .csv formatted as in README"
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2 className='import_first_col'>Data files</h2>
                          <FormLabel style={{'marginLeft': '0px'}} id="raw-files-csv-or-folder-label"></FormLabel>
                          <RadioGroup
                            sx={{'display': hideRadio}}
                            aria-labelledby="raw-files-csv-or-folder-label"
                            defaultValue={currVars.form["raw-files-group"]}
                            name="raw-files-group"
                            className='import_second_col'>
                            <FormControlLabel onClick={(e) => handleFolderSet(e)} value="folder" control={<Radio />} label="Folder" id='folder-radio-control'/>
                            <FormControlLabel onClick={(e) => handleFolderSet(e)} value="csv" control={<Radio />} label="CSV"/>
                          </RadioGroup>
                          <Button
                          variant="contained"
                          component="label"
                          className='import_third_col'
                          >
                            {selectRawText}
                            <input
                              type="file"
                              webkitdirectory={allowDir}
                              directory={allowDir}
                              name="raw-files-path"
                              hidden
                            />
                          </Button>
                          <p id="raw-files-path-tag"
                          className="p_tag_import">{currVars.private["raw-files-path-tag"]}</p>
                      </Stack>
                      </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Tooltip
                    TransitionComponent={Zoom}
                    title="Import .fld file - e.g. for label free, DMSO dispense file"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                              <h2 className='import_first_col'>{LabelInputName}</h2>
                            <br/>
                            <div className='import_second_col' style={{'marginLeft': '16px'}}></div>
                            <Button
                          variant="contained"
                          component="label"
                          className='import_third_col'
                          >
                            Select File
                            <input
                              type="file"
                              name="label-file-path"
                              hidden
                            />
                          </Button>
                            <p id="label-file-path-tag"
                            className="p_tag_import">{currVars.private["label-file-path-tag"]}</p>
                        </Stack>
                            </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Tooltip
                    TransitionComponent={Zoom}
                    title="Import .log file or .log converted to csv"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                              <h2 className='import_first_col' >Pickup file</h2>
                              <div className='import_second_col' style={{'marginLeft': '16px'}}></div>
                            <br/>
                            <Button
                          variant="contained"
                          component="label"
                          className='import_third_col'
                          >
                            Select File
                            <input
                              type="file"
                              name="pickup-file-path"
                              hidden
                            />
                          </Button>
                            <p id="pickup-file-path-tag"
                            className="p_tag_import">{currVars.private["pickup-file-path-tag"]}</p>
                        </Stack>
                        </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Tooltip
                    title="Import as many cell files as desired in .xls format, or converted to .csv"
                    TransitionComponent={Zoom}
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2 className='import_first_col' >Cell files</h2>
                                <div className='import_second_col' style={{'marginLeft': '16px'}}></div>
                              <br/>
                              <Button
                          variant="contained"
                          component="label"
                          className='import_third_col'
                          >
                            Select File
                            <input
                              name="cell-files-path"
                              multiple={true}
                              type="file"
                              hidden
                            />
                          </Button>
                              <p id="cell-files-path-tag"
                            className="p_tag_import">{currVars.private["cell-files-path-tag"]}</p>
                          </Stack>
                          </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Tooltip
                      title="Add additional cellenONE annotation files in .fld format"
                      TransitionComponent={Zoom}
                      arrow placement="top">
                        <Stack direction="row" alignItems= "center" spacing={2}>
                        <h2 display="inline">Additional cellenONE<br></br>annotation files</h2>
                          <div>
                            <form>
                            <div>
                            <Button
                            variant="contained"
                            style={{"margin-left": "16px"}}
                            onClick={handleSubmitER}>Add</Button>
                            </div>
                            </form>
                          <List id="extra-cellone-files-list">
                            {rows.map((row, index) => (
                              <ListItem
                              style={{ "font-size": "100%", "margin": "0px", "display": "flex", "justify-content": "space-evenly"}}
                              key={index}>{row}
                              <Box sx={{ bgcolor: '#c0cedb', width: "100%", borderRadius: 2, padding: "10px", display: "flex", alignItems: "center" }}>
                                <Stack direction="column" alignItems= "center" spacing={2}>
                                <Stack direction="row" alignItems= "center" spacing={2}>
                                <TextField
                                  type="text"
                                  placeholder='Label of file'
                                  variant="outlined"
                                  name={"extra-file-" + index + "-label"}
                                  sx={{ width: '15ch', background: '#f2f2f2', borderRadius: 1 }}/>
                                <Button
                                variant="contained"
                                component="label"
                                className='import_third_col'
                                >
                                  Select File
                                  <input
                                    type="file"
                                    name={"extra-file-" + index}
                                    hidden
                                  />
                                </Button>
                                </Stack>
                                <p id={"extra-file-" + index + "-tag"}
                              className="p_tag_import">No file imported</p>
                                </Stack>
                                <Button variant="contained" style={{margin: "16px"}} onClick={() =>handleDeleteER(index)}>Delete</Button>
                              </Box>
                              </ListItem>
                            ))}
                          </List>
                        </div>  
                      </Stack>
                    </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                              <Tooltip
                              title="Provide folder name to send output to"
                              TransitionComponent={Zoom}
                              arrow placement="top">
                    <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2 className='import_first_col' >Task name</h2>
                                <div className='import_second_col' style={{'marginLeft': '16px'}}></div>
                              <br/>
                              <TextField
                                name="name-job"
                                placeholder="Enter folder name"
                                type="text"
                                value={sanText}
                                onChange={(e) => sanitiseText(e.target.value)}
                                variant="outlined" />
                          </Stack>
                              </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Stack direction="row" alignItems= "center" justifyContent="center" spacing={2}>
                              <Button id="NextImportButton" disabled={currVars.private["NextImportButton-disabled"]} onClick={() =>handleProcessImports(storagePath, store)} component={Link}>{currVars.private["NextImportButton-text"]}</Button>
                    </Stack>
                    </Item>
                    <br></br>
                  </Grid>
                </Grid>
              </Box>
            </FormControl>
          </header>
        </div>
  );
};

export default ImportPage;