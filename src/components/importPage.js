import * as React from 'react';
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
import { getValuesToPopulatePage } from './populatePages';
import Zoom from '@mui/material/Zoom';

import { Link } from "react-router-dom";

import Item from '../components/Item';

function ImportPage() {

  // get store object to pass around for each page, rather than set up each time handleChange called
  const store = setUpStoreObj();

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = window.process.argv.slice(-4, -1)[0];

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

  // when folder radio button is selected, allow selection of directory, when csv, allow file
  const [allowDir, setDir] = React.useState("true");
  const [selectRawText, setRawText] = React.useState("Select Folder");

  const handleFolderSet = () => {

    // when csv set only allow ind files selected
    // when folder set allow dirs to be selected
    if (allowDir === "true") {
      // as long as valid string, webkitdir will be set as true, if not valid string, then will be set as false
      // hence mixed types
      setDir(false)
      setRawText("Select File")
    } else {
      setDir("true")
      setRawText("Select Folder")
    }
  };

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
                          title="Import either folder containing '.raw' files or .csv formatted as in README"
                          arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                            <h2>Raw files</h2>
                          <FormLabel id="raw-files-csv-or-folder-label"></FormLabel>
                          <RadioGroup
                            aria-labelledby="raw-files-csv-or-folder-label"
                            defaultValue={currVars.form["raw-files-group"]}
                            name="raw-files-group">
                            <FormControlLabel onChange={handleFolderSet} value="folder" control={<Radio />} label="Folder" />
                            <FormControlLabel onChange={handleFolderSet} value="csv" control={<Radio />} label="CSV" />
                          </RadioGroup>
                          <Button
                          variant="contained"
                          component="label"
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
                    title="Import .fld file"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                              <h2>Labels file</h2>
                            <br/>
                            <Button
                          variant="contained"
                          component="label"
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
                    title="Import .csv file"
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                              <h2>Pickup file</h2>
                            <br/>
                            <Button
                          variant="contained"
                          component="label"
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
                    title="Import as many .csv cell files as desired"
                    TransitionComponent={Zoom}
                    arrow placement="top">
                      <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Cell files</h2>
                              <br/>
                              <Button
                          variant="contained"
                          component="label"
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
                              title="Select output directory"
                              TransitionComponent={Zoom}
                              arrow placement="top">
                    <Stack direction="row" alignItems= "center" spacing={2}>
                                <h2>Output folder</h2>
                              <br/>
                              <Button
                                variant="contained"
                                component="label"
                                >
                                  Select Folder
                                  <input
                                    name="output-path"
                                    webkitdirectory="true"
                                    directory="true"
                                    type="file"
                                    hidden
                                  />
                                </Button>
                              <p id="output-path-tag"
                            className="p_tag_import">{currVars.private["output-path-tag"]}</p>
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