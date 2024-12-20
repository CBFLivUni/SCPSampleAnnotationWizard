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
  if (currVars.form["tech-type"] === "tmt") {
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

  
  const [hideRowReg, setHideRowReg] = React.useState(getInitialRowRegState);
  const [hideColReg, setHideColReg] = React.useState(getInitialColRegState);

  function getInitialRowRegState() {
    if (currVars.form["invert-row"] === "true"){
      return "flex"
    } else {
      return "none"
    }
  }

  function getInitialColRegState() {
    if (currVars.form["invert-col"] === "true"){
      return "flex"
    } else {
      return "none"
    }
  }

  function rowFinishCondition() {

    // can't check constant as it's not updated in time
    // so check current state and which one was updated.
    let rowValid = checkRowRegexValid()
    let hideReg = getValueRowRadio()

    // only stop progression of finish if row regex is invalid and visible
    if (rowValid !== "valid" && hideReg === "true"){
      return false
    } else {
      return true
    }
  }

  function colFinishCondition() {

    // can't check constant as it's not updated in time
    // so check current state and which one was updated.
    let colValid = checkColRegexValid();
    let hideReg = getValueColRadio();

    // only stop progression of finish if column regex is invalid and visible
    if (colValid !== "valid" && hideReg === "true"){
      return false
    } else {
      return true
    }
  }

  function getValueColRadio() {
    // get value of column radio button

    let val_col;
    document.getElementsByName("invert-col").forEach(function(radio) {
      if (radio.checked) {
        if (radio.value === "true") {
          setHideColReg("flex");
          val_col = "true";
        } else {
          setHideColReg("none");
          val_col = "false";
        }
      }
    });
    return val_col;
  }

  function getValueRowRadio() {
    // get value of row radio button

    let val_row;
    document.getElementsByName("invert-row").forEach(function(radio) {
      if (radio.checked) {
        if (radio.value === "true") {
          setHideRowReg("flex")
          val_row = "true"
        } else {
          setHideRowReg("none")
          val_row = "false"
        }
      }
    });
    return val_row;
  }

  function processRowInv() {
    // if invert row is selected, then show row regex
    // if not, then hide

    let rowRadio = getValueRowRadio();

    checkHideExampleFile()
    checkFinishEnable()
  }

  function processColInv() {
    // if invert column is selected, then show column regex
    // if not, then hide

    let colRadio = getValueColRadio();
    
    checkHideExampleFile()
    checkFinishEnable()
  }

  const [hideExampleFile, setHideExampleFile] = React.useState(getInitialHideExampleFileP);
  
  function getInitialHideExampleFileP() {
    // if row and column regex is hidden, then hide example file
    // if not, then show
    if (hideRowReg === "none" && hideColReg === "none"){
      return "none"
    } else {
      return "flex"
    }
  }

  function checkHideExampleFile() {
    // if row and column regex is hidden, then hide example file

    let colRadio = getValueColRadio();
    let rowRadio = getValueRowRadio();

    // if not, then show
    if (colRadio === "false" && rowRadio === "false"){
      setHideExampleFile("none")
    } else {
      setHideExampleFile("flex")
    }
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

  //TODO could do with a tidy up, but works for now

  // set a switch for checking if regex is valid which changes when
  //var rowValid = "valid"
  //var colValid = "valid"
  //var wellValid = "valid"

  const [colRegexOutput, setColRegexText] = React.useState(createInitialColRegexText);
  const [rowRegexOutput, setRowRegexText] = React.useState(createInitialRowRegexText);
  const [wellRegexOutput, setWellRegexText] = React.useState(createInitialWellRegexText);
  const [finishEnable, setFinishEnable] = React.useState(InitialFinishDisable);
  const [finishButtonText, setFinishText] = React.useState(InitialFinishText);

  // only enable finish button if regex isn't returning no matches or error
  function InitialFinishDisable() {
    // both rowValid and colValid switches are true, enable button else disable
    //if (rowValid === "valid" && colValid === "valid"){

    // initially as row and col regex are hidden, only need to check well regex

    let wellValid = initialProcessWellRegex()

    if(wellValid === "valid"){
      return false
    } else {
      return true
    }
  }

  function initialProcessWellRegex() {
    // check initial message valid

    //let e = {target:{value: currVars.form["well-regex"]}};
    var exampleOutput = processRegex(currVars.form["well-regex"])
    let wellValid = exampleOutput[0]

    return wellValid
  }

  function initialProcessRowRegex() {
    // check initial message valid

    //let e = {target:{value: currVars.form["row-regex"]}};
    var exampleOutput = processRegex(currVars.form["row-regex"])
    let rowValid = exampleOutput[0]

    return rowValid
  }

  function initialProcessColRegex() {
    // check initial message valid

    //let e = {target:{value: currVars.form["col-regex"]}};
    var exampleOutput = processRegex(currVars.form["col-regex"])
    let colValid = exampleOutput[0]

    return colValid
  }


  function checkFinishEnable() {
    // both rowValid and colValid switches are true, enable button else disable

    //rowValid = processRegex({target:{value: currVars.form["row-regex"]}})[0]
    //colValid = processRegex({target:{value: currVars.form["col-regex"]}})[0]
    //wellValid = processRegex({target:{value: currVars.form["well-regex"]}})[0]

    let wellValid = checkWellRegexValid()

    if (wellValid === "valid" && rowFinishCondition() && colFinishCondition()){
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

  function processRegex(regex) {
    // return regex output from  both row and column regex and example file output
    // return array ["valid"/ "invalid", result]
    // if invalid, then don't allow user to click finish, else do.
    const exampleFile = currVars.private["example-raw-f"]

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

  function createInitialWellRegexText() {
    let e = {target:{value: currVars.form["well-regex"]}};
    var exampleOutput = processRegex(currVars.form["well-regex"])
    var message = exampleOutput[1]
    //wellValid = exampleOutput[0]  // set global

    return message
  }

  function createInitialRowRegexText() {
    let e = {target:{value: currVars.form["row-regex"]}};
    var exampleOutput = processRegex(currVars.form["row-regex"])
    var message = exampleOutput[1]
    //rowValid = exampleOutput[0]  // set global

    return message
  }


  function createInitialColRegexText() {
    let e = {target:{value: currVars.form["col-regex"]}};
    var exampleOutput = processRegex(currVars.form["col-regex"])
    var message = exampleOutput[1]
    //colValid = exampleOutput[0]  // set global

    return message
  }

  function checkRowRegexValid() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('row-regex')[0].value

    var exampleOutput = processRegex(regex)
    let rowValid = exampleOutput[0]

    return rowValid
  }

  function checkColRegexValid() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('col-regex')[0].value

    var exampleOutput = processRegex(regex)
    let colValid = exampleOutput[0]

    return colValid
  }

  function processRowRegexChange() {
    // set the change

    let regex = document.getElementsByName('row-regex')[0].value

    var exampleOutput = processRegex(regex)
    var message = exampleOutput[1]

    checkFinishEnable()
    setRowRegexText(message)
  }

  function processColRegexChange() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('col-regex')[0].value

    var exampleOutput = processRegex(regex)
    var message = exampleOutput[1]

    checkFinishEnable()
    setColRegexText(message)
  }

  function checkWellRegexValid() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('well-regex')[0].value

    var exampleOutput = processRegex(regex)
    let wellValid = exampleOutput[0]

    return wellValid
  }

  function processWellRegexChange() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('well-regex')[0].value

    var exampleOutput = processRegex(regex)
    var message = exampleOutput[1]

    checkFinishEnable()
    setWellRegexText(message)
  }

  function processWellRegex() {
    // set message, and return if valid or not

    let regex = document.getElementsByName('well-regex')[0].value

    var exampleOutput = processRegex(regex)
    var message = exampleOutput[1]
    let wellValid = exampleOutput[0]  // set global

    //checkFinishEnable()
    setWellRegexText(message)

    return wellValid
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
                              title="Edit regex if well name is not correctly extracted from raw filename"
                              arrow placement="top">
                                <Stack direction="row" justifyContent= "flex-end" spacing={2}>
                                <p className="p_tag_import"><b>Example file:</b> {currVars.private["example-raw-f"]}</p>
                                </Stack>
                        <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Regex to extract well</h2>
                                <TextField defaultValue={currVars.form["well-regex"]}
                                  name='well-regex'
                                  onChange={processWellRegexChange}/>
                                <p className="p_tag_import"><b>Example output:</b> {wellRegexOutput}</p>
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
                        title="Assign a value to TMT labels or droplets that are currently missing cell data"
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
                          title="Choose the mapping of well to Label file, see README for more info"
                          TransitionComponent={Zoom}
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2>Well to Label mapping CSV</h2>
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
                    <Tooltip
                    TransitionComponent={Zoom}
                    title="Select whether the numbering of column or row should be inverted, see README for more info"
                    arrow placement="top">
                      <h2>Invert Numbering</h2>
                      <Box display={hideExampleFile} alignItems="center" justifyContent="center">
                      <p alignItems="centre"><b>Example file:</b> {currVars.private["example-raw-f"]}</p>
                      </Box>
                      <Stack direction="row" alignItems= "center" spacing={2}>
                          <FormLabel id="invert-col-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="invert-col-label"
                            defaultValue={currVars.form["invert-col"]}
                            name="invert-col">
                            <FormControlLabel value="true" control={<Radio />} onChange={processColInv} label="Invert Column" />
                            <FormControlLabel value="false" control={<Radio />} onChange={processColInv} label="Don't Change Column" />
                          </RadioGroup>
                          <Box display={hideColReg}>
                          <Stack direction="row" spacing={2} display>
                          <TextField defaultValue={currVars.form["col-regex"]}
                                  name='col-regex'
                                  onChange={processColRegexChange}/>
                                <p className="p_tag_import"><b>Example output:</b> {colRegexOutput}</p>
                            </Stack>
                          </Box>
                      </Stack>
                        <Stack direction="row" alignItems= "center" spacing={2} display>
                        <FormLabel id="invert-row-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="invert-row-label"
                            defaultValue={currVars.form["invert-row"]}
                            name="invert-row">
                            <FormControlLabel value="true" control={<Radio />} onChange={processRowInv} label="Invert Row" />
                            <FormControlLabel value="false" control={<Radio />} onChange={processRowInv} label="Don't Change Row" />
                          </RadioGroup>
                          <Box display={hideRowReg}>
                          <Stack direction="row" spacing={2} display>
                          <TextField defaultValue={currVars.form["row-regex"]}
                            name='row-regex'
                            onChange={processRowRegexChange}/>
                          <p className="p_tag_import"><b>Example output:</b> {rowRegexOutput}</p>
                          </Stack>
                          </Box>
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