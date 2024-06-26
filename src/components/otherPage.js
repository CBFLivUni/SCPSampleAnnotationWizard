import * as React from 'react';
import { useState } from 'react'
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import AddIcon from '@mui/icons-material/Add';
import Zoom from '@mui/material/Zoom';

import Item from '../components/Item';

import { handleChangePF, setUpStoreObj } from './processForm';
import { processAdditionalArgs } from './populatePages';
import { getValuesToPopulatePage } from './populatePages';

import { Link } from "react-router-dom";
import path from 'path';
import { changePage } from './handlePageChange';

const { spawnSync } = require('node:child_process');
const platform = processAdditionalArgs('platform');

function OtherPage() {

  // get store object to pass around for each page, rather than set up each time handleChange called
  const store = setUpStoreObj();

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = processAdditionalArgs('storagePath');
  const isDev = processAdditionalArgs('isDev');

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

  // if label-free then hide "well to TMT mapping csv"
  var displayMapping
  if (currVars.form["tech-type"] == "tmt") {
    displayMapping = "inline";
  } else {
    displayMapping = "none";
  }

  const [rows, setRows] = useState(currVars.form["extra-rows"])
  const [inputValue, setInputValue] = useState('')

  function handleChangeER(e){
    setInputValue(e.target.value)
  }

  function handleSubmitER(e){
    e.preventDefault()
    setRows([...rows, inputValue])
    setInputValue('')
  }

  function handleDeleteER(index){
    const newRows = [...rows]
    newRows.splice(index, 1)
    setRows(newRows)
  }

  function processFinalCellPopulationNames(nameCellPopulations, store, storagePath) {

    // process any edits to cell population names
    // value passed in is HTML collection of text inputs where value is current value and name is default value

    // parse names of cell files from array
	  let newCellPopulationsArr = []
    for(var i=0;i < nameCellPopulations.length; i++){
        let newName = nameCellPopulations[i].value;

        newCellPopulationsArr.push(newName) // append to array
    }
    // call handle change
    let event = {target:{value: newCellPopulationsArr, name:'cell-population-names'}};
    handleChangePF(event, store, storagePath)
  }

  function processExtraRows(extraRows, store, storagePath) {

    // get rows to add per raw file, which is tough to get via form change, as so dynamic

    // extraRows are passed in as HTML collection, parse and keep only list text
    let arrRows = []
    for(var i=0;i < extraRows.length; i++){
        let row = extraRows[i].textContent.replace('Delete','');  // also remove Delete text from button
        arrRows.push(row) // append to array
    }

    // call handle change to process extra rows
    let event = {target:{value: arrRows, name:'extra-rows'}};
    handleChangePF(event, store, storagePath)
  }

  function handleSubmitFinish(extraRows, nameCellPopulations, button_click, store, storagePath){
    // handle form being finally submitted
    
    processExtraRows(extraRows, store, storagePath)

    processFinalCellPopulationNames(nameCellPopulations, store, storagePath)

    if (button_click === 'next') {

      // set cursor to waiting
	    document.body.style.cursor  = 'wait';

      let pythonProcess;

      if (isDev === "true") {
        if (platform === 'darwin') {
          // mac dev
          pythonProcess = spawnSync(path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', '..', 'processing/processing'), [storagePath, "analysis"]);
        } else {
          // windows dev
          pythonProcess = spawnSync(path.join(__dirname, '..', '..', '..', '..', '..', '..', 'processing/processing.exe'), [storagePath, "analysis"]);
        }
      } else {
        if (platform === 'darwin') {
          // mac prod
          let pythonProcess = spawnSync(path.join(__dirname, '..', 'processing', 'processing').replace(/ /g, '\\ '), [storagePath, "analysis"], {shell: true});
        } else {
          // windows prod
          console.log("processing.exe path is:")
          console.log(path.join(__dirname, '..', 'processing/processing.exe'));
          let pythonProcess = spawnSync(path.join(__dirname, '..', 'processing/processing.exe'), [storagePath, "analysis"]);
        }
      }

      if (typeof(pythonProcess) === 'undefined') {
        console.log("python did not run")
      } else {
        console.log(pythonProcess.stdout);
      }

      // set cursor to waiting
	    document.body.style.cursor  = 'auto';

      changePage('output');
    } else if (button_click === "previous") {
      changePage('meta');
    }
  }

  // set a switch for checking if regex is valid which changes when
  var rowValid = "valid"
  var colValid = "valid"

  const [colRegexOutput, setColRegexText] = React.useState(createInitialColRegexText);
  const [rowRegexOutput, setRowRegexText] = React.useState(createInitialRowRegexText);
  const [finishEnable, setFinishEnable] = React.useState(InitialFinishDisable);
  const [finishButtonText, setFinishText] = React.useState(InitialFinishText);

  // only enable finish button if regex isn't returning no matches or error
  function InitialFinishDisable() {
    // both rowValid and colValid switches are true, enable button else disable
    if (rowValid === "valid" && colValid === "valid"){
      return false
    } else {
      return true
    }
  }

  function checkFinishEnable() {
    // both rowValid and colValid switches are true, enable button else disable
    if (rowValid === "valid" && colValid === "valid"){
      setFinishEnable(false)
      setFinishText("FINISH")
    } else {
      setFinishEnable(true)
      setFinishText("Regex must extract valid output")
    }
  }

  function InitialFinishText() {
    if (InitialFinishDisable()){
      return "Regex must extract valid output"
    } else {
      return "FINISH"
    }
  }

  function processRegex(e) {
    // return regex output from  both row and column regex and example file output
    // return array ["valid"/ "invalid", result]
    // if invalid, then don't allow user to click finish, else do.
    const exampleFile = currVars.private["example-raw-f"]
    const regex = e.target.value

    if (regex === "") {
      // if blank, then warn no matches
      return ["invalid", "NO MATCHES - ENTER CORRECT REGEX"]
    }

    var re;
    // try regex, tell user if invalid expression
    try {
      re = new RegExp(regex);
      var output = re.exec(exampleFile);  // first results is the group, second is the match

      if (output == null){
        // if null, then no results
        return ["invalid", "NO MATCHES - ENTER CORRECT REGEX"]
      } else if (output.length < 2) {
        // length = 1 is standard, output, 2 or more is output
        return ["invalid", "NO MATCHES - ENTER CORRECT REGEX"]
      } else if (output[1] === "") {
        // output is blank
        return ["invalid", "NO MATCHES - ENTER CORRECT REGEX"]
      } else {
        // else, if there are results, take the second in the array, as that's the match
        return ["valid", output[1]]  // first results is the group, second is the match
      }
    }
    catch(err) {
      // if error, i.e. invalid regex, then show user the error
      return ["invalid", err.message]
    }
  }


  function createInitialRowRegexText() {
    let e = {target:{value: currVars.form["row-regex"]}};
    var exampleOutput = processRegex(e)
    var message = exampleOutput[1]
    rowValid = exampleOutput[0]  // set global

    return message
  }


  function createInitialColRegexText() {
    let e = {target:{value: currVars.form["col-regex"]}};
    var exampleOutput = processRegex(e)
    var message = exampleOutput[1]
    colValid = exampleOutput[0]  // set global

    return message
  }


  function processRowRegex(e) {
    var exampleOutput = processRegex(e)
    var message = exampleOutput[1]
    rowValid = exampleOutput[0]  // set global

    checkFinishEnable()
    setRowRegexText(message)
  }

  function processColRegex(e) {
    var exampleOutput = processRegex(e)
    var message = exampleOutput[1]
    colValid = exampleOutput[0]  // set global

    checkFinishEnable()
    setColRegexText(message)
  }

  const [disableOffset, setOffsetDisable] = React.useState(getInitialOffsetState);

  function getInitialOffsetState() {
    return currVars.private["offset-disabled"]
  }

  function changePickup(e) {
    // if pickup set for Single, then disable offset button
    // if dual, then allow user input offset
    var disable;
    if (e.target.value === "single"){
      disable = true
    } else {
      disable = false
    }
    setOffsetDisable(disable)
    // send to storage in case page changes, as well
    let event = {target:{value: disable, name:'offset-disabled'}};
    handleChangePF(event, store, storagePath)
  }

  <IconButton onClick={handleSubmitER}>
                              <AddIcon />
                            </IconButton>

  return(
    <div className="App">
          <header className="App-header">
            <h1 className="page-title">Other Options</h1>
            <FormControl
            onChange={(event) => handleChangePF(event, store, storagePath)}>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container direction="column" className="outer-grid-layout" spacing={2}>
                <Grid item>
                      <Item>
                              <Tooltip
                              TransitionComponent={Zoom}
                              title="Edit regex if column and row names are not correctly extracted from raw filename"
                              arrow placement="top">
                                <Stack direction="row" justifyContent= "flex-end" spacing={2}>
                                <p className="p_tag_import"><b>Example file:</b> {currVars.private["example-raw-f"]}</p>
                                </Stack>
                        <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Regex to extract row</h2>
                                <TextField defaultValue={currVars.form["row-regex"]}
                                  name='row-regex'
                                  onChange={processRowRegex}/>
                                <p className="p_tag_import"><b>Example output:</b> {rowRegexOutput}</p>
                        </Stack>
                        <br/>
                        <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Regex to extract col</h2>
                                <TextField defaultValue={currVars.form["col-regex"]}
                                  name='col-regex'
                                  onChange={processColRegex}/>
                                <p className="p_tag_import"><b>Example output:</b> {colRegexOutput}</p>
                        </Stack>
                              </Tooltip>
                    </Item>
                    </Grid>
                    <Grid item>
                    <Item>
                              <Tooltip
                              TransitionComponent={Zoom}
                              title="Choose how cell files should be named"
                              arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Name cell populations</h2>
                              <br/>
                              <Stack direction="column" alignItems= "center" spacing={2} id='cell-population-names-stack'>
                                {currVars.form['cell-population-names'].map(function(object, i){
                                  return<TextField defaultValue={currVars.form['cell-population-names'][i]}
                                  name={currVars.form['cell-population-names'][i]}/>;
                                })}
                              </Stack>
                        </Stack>
                              </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                        <Tooltip
                        TransitionComponent={Zoom}
                        title="Assign a value to TMT labels or ({label free input file name}) that are currently missing cell data"
                        arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                          <h2 display="inline">Name missing cell data values</h2>
                          <TextField name="label-missing-data" defaultValue={currVars.form["label-missing-data"]} variant="outlined" />
                      </Stack>
                        </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                        <Tooltip
                        TransitionComponent={Zoom}
                        title="Add extra rows per raw file, in addition to the labels given to missing data defined above"
                        arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                        <h2 display="inline">Add extra rows per raw file</h2>
                          <div>
                            <form>
                            <div style={{"display": "flex", "align-items": "center"}}>
                            <TextField
                            value={inputValue}
                            onChange={handleChangeER}/>
                            <Button
                            variant="contained"
                            style={{"margin-left": "16px"}}
                            onClick={handleSubmitER}>Add</Button>
                            </div>
                            </form>
                          <List id="extra-rows-to-add">
                            {rows.map((row, index) => (
                              <ListItem
                              style={{"display": "flex", "justify-content": "space-evenly", "font-size": "140%"}}
                              key={index}>{row}
                                <Button variant="contained" onClick={() =>handleDeleteER(index)}>Delete</Button>
                              </ListItem>
                            ))}
                          </List>
                        </div>  
                      </Stack>
                        </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item sx={{
                        display: displayMapping
                      }}>
                    <Item>
                          <Tooltip
                          title="Choose the mapping of well to TMT file see README for more info"
                          TransitionComponent={Zoom}
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2>Well to TMT mapping CSV</h2>
                          <FormLabel id="well-to-tmt-mapping-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="well-to-tmt-mapping-label"
                            defaultValue={currVars.form["well-to-tmt-mapping"]}
                            name="well-to-tmt-mapping">
                            <FormControlLabel value="default" control={<Radio />} label="Default" />
                            <FormControlLabel value="select" control={<Radio />} label="Select" />
                          </RadioGroup>
                          <Button
                          id = 'select-tmt-mapping'
                          variant="contained"
                          component="label"
                          disabled={currVars.private["select-tmt-mapping-disabled"]}
                          >
                            Select File
                            <input
                              type="file"
                              name="tmt-mapping-path"
                              hidden
                            />
                          </Button>
                          <p id="tmt-mapping-path-tag"
                          className="p_tag_import">{currVars.private["tmt-mapping-path-tag"]}</p>
                      </Stack>
                              </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Tooltip
                    TransitionComponent={Zoom}
                    title="Select whether data was generated from single pickup or dual pickup. If dual, then include the offset of the X position from the first position to the second"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2>Pickup type</h2>
                          <FormLabel id="pickup-type-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="pickup-type-label"
                            defaultValue={currVars.form["pickup-type"]}
                            name="pickup-type-group">
                            <FormControlLabel value="single" control={<Radio />} onChange={changePickup} label="Single" />
                            <FormControlLabel value="dual" control={<Radio />} onChange={changePickup} label="Dual" />
                          </RadioGroup>
                          <TextField name="offset" disabled={disableOffset} label="X Position Offset" defaultValue={currVars.form["offset"]} variant="outlined" />
                      </Stack>
                              </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                      <Stack direction="row" alignItems= "center" justifyContent="center" spacing={2}> 
                        <Button component={Link} onClick={() =>handleSubmitFinish(document.getElementById("extra-rows-to-add").getElementsByTagName("li"),
                        document.getElementById("cell-population-names-stack").getElementsByTagName("input"), "previous", store, storagePath
                        )}>Previous</Button>
                        <Button component={Link} disabled={finishEnable} onClick={() =>handleSubmitFinish(document.getElementById("extra-rows-to-add").getElementsByTagName("li"),
                        document.getElementById("cell-population-names-stack").getElementsByTagName("input"), "next", store, storagePath
                        )}>{finishButtonText}</Button>
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

export default OtherPage;