import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Zoom from '@mui/material/Zoom';
import { changePage } from './handlePageChange';

import ColMismatch from '../components/ColMismatch';
import Item from '../components/Item';

import { handleChangePF, setUpStoreObj } from './processForm';
import { getValuesToPopulatePage, processAdditionalArgs } from './populatePages';

import { Link } from "react-router-dom";

function MetaPage() {

  // get store object to pass around for each page, rather than set up each time handleChange called
  const store = setUpStoreObj();

  const [open, setOpen] = React.useState(false);

  // handle warning about going back a page
  const handleOpenDialog = () => {
    // for warn dialog
    setOpen(true);
  };

  const handleCloseDialogReturn = () => {
    // for warn dialog when return page
    setOpen(false);
    changePage('/');
  };

  const handleCloseDialogCurrent = () => {
    // for warn dialog when stay on current page
    setOpen(false);
  };

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = processAdditionalArgs('storagePath');

  function handleCellFileMismatches(html, store, storagePath) {
    // handle saving cell file mismatch data

    let cellFileMismatches = {};

    for (var i = 0; i < html.length; i++) {

      // parse name from h2 header, removing the 'column :''
      let fullNameString = html[i].querySelector("#name").innerHTML;
      let name = fullNameString.substring(fullNameString.indexOf("'") + 1, fullNameString.lastIndexOf("'"));

      // check if the "remove" radio button is checked
      // if it is, then value is remove, else false
      // this is a bit hacky and not very "react-y"

      let removeChecked = html[i].querySelectorAll("input[value='remove']")[0].checked

      let handle;

      if (removeChecked === true) {
        handle = 'remove'
      } else {
        handle = 'fill'
      } 

      cellFileMismatches[name] = {"isIn":html[i].querySelector("#is-in").innerHTML,
                                  "notIn":html[i].querySelector("#not-in").innerHTML,
                                  "handle": handle,
                                  "fillValue":html[i].querySelector("#fill-as").value};

    }

    let event = {target:{value: cellFileMismatches, name:'column-mismatches-change'}};
    handleChangePF(event, store, storagePath)

    // change page
    changePage("other");
  }

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

  return(
    <div className="App">
          <header className="App-header">
            <h1>Metadata</h1>
            <FormControl
            onChange={(event) => handleChangePF(event, store, storagePath)}>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container direction="column" className="outer-grid-layout" spacing={2}>
                <Grid item>
                    <Item>
                    <Tooltip
                    title="Tick columns to include in output file"
                    TransitionComponent={Zoom}
                    arrow placement="top">
                      <FormGroup id="meta-form" >
                        <h2>Metadata to Include</h2>
                      {currVars.form['meta-to-include'].map(function(object, i){
                                  return<FormControlLabel control={<Checkbox defaultChecked={currVars.form['meta-to-include'][i]['checked']} />} disabled={currVars.form['meta-to-include'][i]['disabled']}
                                  label={currVars.form['meta-to-include'][i]['name']} name={'change-meta'}/>;
                                })}
                      </FormGroup>
                      </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                        <Tooltip
                        title="Decide how to handle columns that are present in one cell file, but not others"
                        TransitionComponent={Zoom}
                        arrow placement="top">
                        <h2>Handle Cell File Column Mismatches</h2>
                        <Stack direction="column" alignItems= "center" spacing={2} id='cell-file-mismatches-stack'>
                                {(() => {
                                  if (Object.keys(currVars.form['column-mismatches']).length === 0) {
                                    return (
                                      <p>No column mismatches</p>
                                    )
                                  }})()}
                                {Object.keys(currVars.form['column-mismatches']).map(function(col, i){
                                  return<ColMismatch name={col} isIn={currVars.form['column-mismatches'][col]['isIn']} notIn={currVars.form['column-mismatches'][col]['notIn']} handle={currVars.form['column-mismatches'][col]['handle']} fillValue={currVars.form['column-mismatches'][col]['fillValue']}/>;
                                })}
                      </Stack>
                        </Tooltip>
                    </Item>
                  </Grid>
                  <Grid item>
                    <Item>
                    <Stack direction="row" alignItems= "center" justifyContent="center" spacing={2}>
                      <React.Fragment>
                      <Button onClick={handleOpenDialog}>Previous</Button>
                      <Dialog open={open}>
                          <DialogTitle>{"Return to previous page?"}</DialogTitle >
                          <DialogContent>
                            <DialogContentText style={{whiteSpace: 'pre-line'}} id="alert-dialog-description">
                            {'Current settings will be lost if returning to the previous page as imports will be processed again. \n \n Are you sure you want to proceed?'}
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                          <Button component={Link} onClick={handleCloseDialogReturn}>Return to previous page</Button>
                          <Button component={Link} onClick={handleCloseDialogCurrent} autoFocus>Stay on current page</Button>
                        </DialogActions>
                      </Dialog>
                      </React.Fragment>
                      <Button component={Link} onClick={() =>handleCellFileMismatches(document.getElementsByClassName("mismatch-item"), store, storagePath)}>Next</Button>
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

export default MetaPage;