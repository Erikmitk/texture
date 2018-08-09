import ManifestLoader from './ManifestLoader'

export default class VfsStorageClient {
  constructor (vfs, baseUrl) {
    this.vfs = vfs

    // an url rom where the assets are served statically
    this.baseUrl = baseUrl
  }

  read (archiveId, cb) {
    let rawArchive = _readRawArchive(this.vfs, archiveId, this.baseUrl)
    cb(null, rawArchive)
  }

  write (archiveId, data, cb) { // eslint-disable-line
    console.error('Can not write on virtual file system')
    console.info('This would have been written:', data)
    cb(null, false)
  }
}

function _readRawArchive (fs, archiveId, baseUrl = '') {
  let manifestXML = fs.readFileSync(`${archiveId}/manifest.xml`)
  let manifestSession = ManifestLoader.load(manifestXML)
  let manifest = manifestSession.getDocument()
  let docs = manifest.findAll('documents > document')
  let assets = manifest.findAll('assets > asset')
  let rawArchive = {
    version: '0',
    resources: {
      'manifest.xml': {
        encoding: 'utf8',
        data: manifestXML
      }
    }
  }

  docs.forEach(entry => {
    let path = entry.attr('path')
    if (fs.existsSync(`${archiveId}/${entry.path}`)) {
      let content = fs.readFileSync(`${archiveId}/${entry.path}`)
      rawArchive.resources[path] = {
        encoding: 'utf8',
        data: content
      }
    } else {
      console.warn(`${archiveId}/${entry.path} not found in vfs`)
    }
  })
  assets.forEach(asset => {
    let path = asset.attr('path')
    // TODO: we could store other stats and maybe mime-types in VFS
    rawArchive.resources[path] = {
      encoding: 'url',
      data: baseUrl + archiveId + '/' + path
    }
  })
  return rawArchive
}
