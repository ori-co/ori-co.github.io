const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/VERSO A.json'),
      require('../image-targets/VERSO B.json'),
      require('../image-targets/VERSO C.json'),
      require('../image-targets/VERSO D.json'),
      require('../image-targets/ImageTarget_testcard.json')
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

