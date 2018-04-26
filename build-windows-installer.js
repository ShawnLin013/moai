let { MSICreator } = require('electron-wix-msi');
let packageInfo = require('./package.json');
let arches = ['ia32', 'x64'];

arches.forEach(function (arch) {
  console.log(`[${arch}] Start Building...`);
  
  // Step 1: Instantiate the MSICreator
  const msiCreator = new MSICreator({
    appDirectory: `${process.env.PWD}/build/MOAI-win32-${arch}`,
    outputDirectory: `${process.env.PWD}/build/MOAI-win32-${arch}-installer`,
    description: packageInfo.description,
    exe: packageInfo.productName,
    name: packageInfo.productName,
    manufacturer: packageInfo.productName,
    version: packageInfo.version,
    ui: {
      chooseDirectory: true,
      images: {
        background: `${process.env.PWD}/images/WixUIDialogBmp.png`,
        banner: `${process.env.PWD}/images/WixUIBannerBmp.png`,
        exclamationIcon: `${process.env.PWD}/images/WixUIExclamationIco.ico`,
        infoIcon: `${process.env.PWD}/images/WixUIInfoIco.ico`,
        newIcon: `${process.env.PWD}/images/WixUINewIco.ico`,
        upIcon: `${process.env.PWD}/images/WixUIUpIco.ico`
      }
    }
  });
  
  // Step 2: Create a .wxs template file
  msiCreator.create().then(() => {
    // Step 3: Compile the template to a .msi file
    msiCreator.compile().then(() => {
      console.log(`[${arch}] Build Success!`);
    });
  });
});
