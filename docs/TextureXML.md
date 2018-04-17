# TextureXML - Internal schema powering the editor

This is the XML structure, used internally by Texture. It's largely the same as JATS4M, but we optimised the layout to be easier to manipulate. For instance in TextureXML, we use flat headings instead of nested sections, which allows for Word-like editing behaviour.

*NOTE: All data about contribs, references, affiliations live in a separate database outside of the XML. See `EntityDatabase.js` for the schema to be used*  


### `<aff>`

```
@id
@rid points to entityId in entity database
```

Example:

```xml
<aff id="aff1" rid="organisation-1"></aff>
```

### `<contrib>`

```
@id
@equal-contrib signifies equal contribution
@rid points to entityId in entity database
```

Example for authors group:

```xml
<contrib-group content-type="authors" equal-contrib="yes">
  <contrib rid="person-25" equal-contrib="yes"/>
  <contrib rid="organisation-1" equal-contrib="yes"/>
</contrib-group>
```

### `<inline-math>`

```xml
<inline-math><![CDATA[f\in {\mathcal C}^0([0,+\infty )).]]></inline-math>
```

### `<list>`

```
@id
@list-type bullet|order

list-item
```

```xml
<list list-type="bullet">
  <list-item level="1">item 1</list-item>
  <list-item level="2">item 1.1</list-item>
  <list-item level="2">item 1.2</list-item>
</list>
```

### `<list-item>`

```
@level

#PCDATA
```

### `<ref>`:

```
@id used as targets in xref
@rid points to entityId in entity database
```

Example:

```xml
<ref id="r1" rid="journal-article-24"></ref>
```


## Reproducible Extensions

*NOTE, this elements are not supported by Texture directly, but can be used with Stencila.*

### `cell`

```
@paused (yes|no)
source-code, output
```

Example:

```xml
<cell paused="yes">
  <source-code language="mini"><![CDATA[6 * 7]]></source-code>
  <output language="json"><![CDATA[{}]]></output>
</cell>
```

## Inline Cell

*Can be used within text. Must not produce variables.*

```xml
<inline-cell>
  <source-code language="mini"><![CDATA[6 * 7]]></source-code>
  <output language="json"><![CDATA[{}]]></output>
</inline-cell>
```


### `repro-fig`

```
object-id[pub-id-type=doi], title, caption, cell
```

Example:

```xml
<repro-fig>
  <object-id pub-id-type="doi">...</object-id>
  <title>Reproducible figure title</title>
  <caption>
    <p>Some caption</p>
  </caption>
  <cell>
    <source-code language="mini"><![CDATA[6 * 7]]></source-code>
    <output language="json"><![CDATA[{}]]></output>
  </cell>
</repro-fig>
```
