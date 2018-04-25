var electronInstaller = require('electron-winstaller');
resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: './build/moai-win32-x64',
    outputDirectory: './build/moai-win32-x64-installer',
    noMsi: true,
    authors: 'Shawn',
    exe: 'Moai.exe'
});
resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));