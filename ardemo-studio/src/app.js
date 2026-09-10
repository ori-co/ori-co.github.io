const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/ImageTarget_fullcard.json'),
      require('../image-targets/ImageTarget_testcard.json'),
      require('../image-targets/PhotoTarget.json')
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

