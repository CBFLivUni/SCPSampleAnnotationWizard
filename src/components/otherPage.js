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


function OtherPage() {

  // get store object to pass around for each page, rather than set up each time handleChange called
  const store = setUpStoreObj();

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = processAdditionalArgs(window.process.argv)['storagePath'];
  const isDev = processAdditionalArgs(window.process.argv)['isDev'];

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

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
        let pythonProcess = spawnSync(path.join(__dirname, '..', '..', '..', '..', '..', '..', 'processing/processing.exe'), [storagePath, "analysis"]);
      } else {
        console.log("processing.exe path is:")
        console.log(path.join(__dirname, '..', 'processing/processing.exe'));
        let pythonProcess = spawnSync(path.join(__dirname, '..', 'processing/processing.exe'), [storagePath, "analysis"]);
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
                        title="Choose values for TMT labels with no cell data"
                        arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                          <h2 display="inline">Name TMT labels with no cell data</h2>
                          <TextField name="label-missing-data" defaultValue={currVars.form["label-missing-data"]} variant="outlined" />
                      </Stack>
                        </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                        <Tooltip
                        TransitionComponent={Zoom}
                        title="Add extra rows per raw file"
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
                  <Grid item>
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
                    title="Included for future compatibility, currently only single pickup is supported"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2>Pickup type</h2>
                          <FormLabel id="pickup-type-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="pickup-type-label"
                            defaultValue="single"
                            name="pickup-type-group">
                            <FormControlLabel value="single" control={<Radio />} label="Single" />
                            <FormControlLabel value="dual" disabled={true} control={<Radio />} label="Dual" />
                          </RadioGroup>
                          <TextField name="labelMissingData" disabled={true} label="Offset" defaultValue="18" variant="outlined" />
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
                        <Button component={Link} onClick={() =>handleSubmitFinish(document.getElementById("extra-rows-to-add").getElementsByTagName("li"),
                        document.getElementById("cell-population-names-stack").getElementsByTagName("input"), "next", store, storagePath
                        )}>Finish</Button>
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