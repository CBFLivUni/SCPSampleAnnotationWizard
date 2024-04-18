import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import Item from '../components/Item';

import { Link } from "react-router-dom";

//import { setUpStoreObj } from './processForm';
import { getValuesToPopulatePage } from './populatePages';
import { settingsDefaults} from './storeDefaults.js'
import { changePage } from './handlePageChange';

const jsonfilePath = window.process.argv.slice(-4, -1)[1];
const jsonfile = require(jsonfilePath);
//const jsonfile = require(path.join(__dirname, '../app.asar/node_modules/jsonfile'));
//const jsonfile = require('jsonfile');


function OutputPage() {

  function handleStartAgain(storagePath, settingsDefaults) {
    // set defaults for storage if start again clicked

    // was being buggy and firing on other pages, so double check that on other options page before clearing settings
    if (document.URL.includes('output')) {
      jsonfile.writeFileSync(storagePath, settingsDefaults)
    }
    changePage('/')
  }

  function backPage() {
    changePage('other')
  }

  // get store object to pass around for each page, rather than set up each time handleChange called
  //const store = setUpStoreObj();

  // this is storage path, passed from from additionalArguments in main.js
  // must be within each page, otherwise can't access window
  const storagePath = window.process.argv.slice(-4, -1)[0];

  // when page is open, populate with values from store
  let currVars = getValuesToPopulatePage(storagePath);

  // show errors from log file
  let logFilePath = currVars.form['output-path'] + "\\scpannotationwizard.log"

  const fs = module.constructor._load('fs');
  let fullLog = fs.readFileSync(logFilePath, 'utf8')
  let arrayLog = fullLog.split('\n')

  // keep only log entries that are errors
  let errorText = '';
  for (let i = 0; i < arrayLog.length; i++) {
    if (arrayLog[i].startsWith('ERROR')) {
      errorText += arrayLog[i] + '\n'
    }
  }


  //var enc = new TextDecoder("utf-8");

  return(
    <div className="App">
          <header className="App-header">
            <h1 className="page-title">Output</h1>
            <FormControl>
              <Box sx={{ flexGrow: 1 }}>
                <Grid container direction="column" className="outer-grid-layout" spacing={2}>
                <Grid item>
                    <Item>
                      <h2>Processing Complete</h2>
                      <p>Results saved to output folder:</p>
                      <p>{currVars.private['output-path-tag']}</p>
                      {(() => {
                        if (errorText !== '') {
                          return (
                            <div>
                            <h2>Errors</h2>
                            <TextField
                        id="error-text"
                        fullWidth
                        value={errorText}
                        multiline
                        variant="outlined"
                        disabled={true}
                      />
                      </div>
                          )
                        }})()}
                      <p>See 'scpannotationwizard.log' for more information</p>
                      </Item>
                    <br></br>
                  </Grid>
                  <Grid item>
                    <Item>
                      <Stack direction="row" alignItems= "center" justifyContent="center" spacing={2}>
                        <Button component={Link} onClick={backPage}>Previous</Button>
                        <Button component={Link} onClick={() =>handleStartAgain(storagePath, settingsDefaults)} to={""}>Start again</Button>
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

export default OutputPage;