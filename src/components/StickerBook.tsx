import { STICKERS } from '../lib/content'
import { t } from '../lib/i18n'
import StickerArt from './StickerArt'

export default function StickerBook({ owned }: { owned: string[] }) {
  const have = STICKERS.filter((s) => owned.includes(s)).length
  return (
    <section className="card sticker-book">
      <h2>{t('garden.stickers')}</h2>
      <p className="muted">{t('garden.stickers.count', { a: have, b: STICKERS.length })}</p>
      <ul className="stickers">
        {STICKERS.map((id) => {
          const mine = owned.includes(id)
          return (
            <li key={id} className={mine ? 'sticker own' : 'sticker'}>
              <span className="sticker-tile" role="img" aria-label={mine ? t(`sticker.${id}`) : t('garden.sticker.locked')}>
                <StickerArt id={id} size={56} silhouette={!mine} />
              </span>
              <span className="sticker-name" aria-hidden="true">{mine ? t(`sticker.${id}`) : '?'}</span>
            </li>
          )
        })}
      </ul>
      <p className="muted">{t('garden.stickers.help')}</p>
    </section>
  )
}
