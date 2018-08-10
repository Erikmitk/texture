import { Component } from 'substance'
import DOIInputComponent from './DOIInputComponent'
import ReferenceUploadComponent from './ReferenceUploadComponent'

const targetTypes = [
  'journal-article', 'book', 'chapter', 'conference-paper',
  'report', 'newspaper-article', 'magazine-article', 'data-publication',
  'patent', 'webpage', 'thesis', 'software'
]

export default class AddReferenceWorkflow extends Component {
  didMount() {
    super.didMount()

    this.handleActions({
      'importBib': this._onImport
    })
  }

  render($$) {
    const labelProvider = this.context.labelProvider

    let el = $$('div').addClass('se-add-reference')

    const title = $$('div').addClass('se-title').append(
      labelProvider.getLabel('add-reference-title')
    )

    const manualAddEl = $$('div').addClass('se-manual-add').append(
      $$('div').addClass('se-section-title').append(
        labelProvider.getLabel('add-ref-manually')
      )
    )

    const refTypesButtons = $$('ul').addClass('se-reftypes-list')
    targetTypes.forEach(item => {
      refTypesButtons.append(
        $$('li').addClass('se-type').append(
          labelProvider.getLabel(item)
        ).on('click', this._onAdd.bind(this, item))
      )
    })
    manualAddEl.append(refTypesButtons)

    el.append(
      title,
      $$(DOIInputComponent),
      $$(ReferenceUploadComponent),
      manualAddEl
    )

    return el
  }

  _onImport(items) {
    const api = this.context.api
    const collection = api.getCollectionForType('reference')
    collection.addItems(items)
    this.send('closeModal')
  }

  _onAdd (type) {
    const api = this.context.api
    const collection = api.getCollectionForType('reference')
    collection.addItem({type: type})
    this.send('closeModal')
  }
}