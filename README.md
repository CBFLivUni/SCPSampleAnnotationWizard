# SCP Sample Annotation Wizard

# User Information

- Generates sample annotation .csv files to be passed to the colData argument in the readSCP() function from the [scp R package](https://uclouvain-cbio.github.io/scp/index.html)

- Download Mac and Windows releases [here](https://github.com/CBFLivUni/SCPSampleAnnotationWizard/releases)

# Developer Information

- Written using Electron JS + React, pricessing script in Python.

### Processing script

- Create virtual env using your preferred method using `requirements.txt`.

`pip install pyinstaller`

For Windows:
`pyinstaller -F processingpy/processing.py`
`mv processingpy/processing.exe processing`

For Mac:
`pyinstaller processingpy/processing.py`

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## ElectronJS + React Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
Note: may run incorrectly in browser due to Node JS requirements, check Electron window for correct output.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run make`

Makes executable for Windows and MacOS.

### For Mac
- For Mac production build, following `npm run make`, unzip output file, then contents of `dist/processing` generated from `pyinstaller` needs to be copied to `scpannotation.app/Contents/Resources/processing/`.
- Permissions of `processing` must also be set so is executable by user. Otherwise, file isn't executable within app.asar.
- `scpannotation.app` can be renamed 'SCPSampleAnnotationWizard' (spaces in title aren't recommended), favicon added, then zipped together with `/processing/README.xlsx` for distribution.

### For Windows
- Check file paths of `inno/scpannotator.iss`.
- `inno/scpannotator.iss` can then be used with [Inno Setup](https://jrsoftware.org/isinfo.php) to create a Windows installer.