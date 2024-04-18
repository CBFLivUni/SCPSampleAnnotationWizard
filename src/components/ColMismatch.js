import React, { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';

import Item from '../components/Item';

function ColMismatch({name, isIn, notIn, handle, fillValue}) {

	// if radio set as "remove" not "fill", then disable Text field
	// use state to alter whether TextField is disabled.

	let defaultDisabled

	if (handle === 'remove') {
		defaultDisabled = true;
	} else {
		defaultDisabled = false;
	}

	let [disabled, setDisabled] = useState(defaultDisabled)

	function handleChange() {
		if (disabled === true){
			disabled = false
		} else {
			disabled = true
		}
		setDisabled(disabled)
	}

	return (
		<Box
		component="form"
		sx={{
		  '& > :not(style)': { m: 1, width: 'auto' },
		}}
		noValidate
		autoComplete="off"
	  >
		<Grid container direction="column" className="outer-grid-layout" spacing={2}>
                <Grid item class="mismatch-item">
                    <Item>
						<h2 id='name'>{'Column: \'' + name + '\''}</h2>
						<Stack direction="row" alignItems= "center" spacing={2}>
						<h3>In:</h3>
						<p id='is-in'>{isIn}</p>
						</Stack>
						<Stack direction="row" alignItems= "center" spacing={2}>
						<h3>Not in:</h3>
						<p id='not-in'>{notIn}</p>
						</Stack>
						<Stack direction="row" alignItems= "center" spacing={2} >
						<FormControl name='handle'>
						<RadioGroup
                            aria-labelledby="raw-files-csv-or-folder-label"
                            defaultValue={handle}
                            id="handle-mismatches"
							onChange={handleChange}>
                            <FormControlLabel id="remove-radio" value="remove" control={<Radio />} label="Remove" />
                            <FormControlLabel value="fill" control={<Radio />} label="Fill missing" />
                          </RadioGroup>
						  </FormControl>
						  <TextField sx={{width: 'auto'}} id="fill-as" label="Fill as..." defaultValue={fillValue} variant="outlined" disabled={disabled} />
						  </Stack>
                    </Item>
                  </Grid>
				</Grid>
	  </Box>
	);
  }

export default ColMismatch;