const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/ImageTarget_faceB.json'),
      require('../image-targets/ImageTarget_faceB_v2.json'),
      require('../image-targets/ImageTarget_faceB_photo.json'),
      require('../image-targets/DrawingTarget.json'),
      require('../image-targets/ImageTarget.json')
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)

