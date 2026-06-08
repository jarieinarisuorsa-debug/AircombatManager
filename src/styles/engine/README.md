# Aircombat UI Engine

Tämä kansio sisältää Aircombat Competition Managerin joustavan käyttöliittymämoottorin. Moottori jakaantuu neljään tiedostoon:

## 1. tokens.css (Design Tokens)
Määrittelee sovelluksen yhtenäiset muuttujat, kuten:
- **Spacing**: `--ui-space-1` ... `--ui-space-8`
- **Typography**: `--ui-font-sm`, `--ui-font-base`, `--ui-font-lg`
- **Radii**: `--ui-radius-sm`, `--ui-radius-full`
- **Colors**: `--ui-color-surface`, `--ui-color-primary`

## 2. layout.css (Layout Primitives)
Sisältää rakenne- ja sijoitteluapuluokat:
- `.ui-row` (Flex row, automaattinen väli)
- `.ui-col` (Flex column, automaattinen väli)
- `.ui-grow` (`flex: 1` täyttämään tilan)
- `.ui-shrink-0` (`flex-shrink: 0`)
- `.ui-scroll-y` (Rullattava alue pystysuunnassa)

## 3. components.css (Komponentit)
Valmiit erilliset palikat. Tällä hetkellä tänne on rakennettu Chat-komponentit:
- `.ui-chat-wrapper`, `.ui-chat-messages`
- `.ui-chat-bubble`, `.is-me`, `.is-other`
- `.ui-chat-form`, `.ui-chat-input`

## 4. utilities.css (Apuluokat)
Yksittäisen ominaisuuden muuttajat:
- `.ui-text-sm`, `.ui-text-muted`, `.ui-text-danger`
- `.ui-m-0`, `.ui-p-0`, `.ui-px-4`
- `.ui-cursor-pointer`

## Käyttöesimerkki:

```html
<div class="ui-col ui-grow">
  <div class="ui-row">
    <div class="ui-grow ui-text-lg">Otsikko</div>
    <button class="ui-shrink-0">Tallenna</button>
  </div>
  <div class="ui-scroll-y ui-grow ui-p-4">
    <!-- Rullaava sisältö -->
  </div>
</div>
```

Tällä moottorilla vältetään turhien yksittäisten CSS-sääntöjen keksiminen JS-koodissa!
