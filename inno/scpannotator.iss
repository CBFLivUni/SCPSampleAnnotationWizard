[Setup]
AppName=SCP Sample Annotation Wizard
AppVersion=0.1
WizardStyle=modern
DefaultDirName={autopf}\SCPSampleAnnotationWizard
DefaultGroupName=SCP Sample Annotation Wizard
Compression=lzma2
SolidCompression=yes

[Files]
Source: "...\scpannotation\out\make\squirrel.windows\x64\scpannotation-0.1.0 Setup.exe"; DestDir: "{app}"
Source: "...\scpannotation\processing\README.xlsx"; DestDir: "{app}"; Flags: isreadme
Source: "....\favicon\favicon_wiz.ico"; DestDir: "{app}";

[Icons]
Name: "{group}\SCP Sample Annotation Wizard"; Filename: "{app}\scpannotation-1.0.0 Setup.exe"; IconFilename:"{app}\favicon_wiz.ico";
