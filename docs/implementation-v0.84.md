# Wdrożenie 0.84 — wyposażenie statków z części

## Zmiana gospodarki

`equipmentCosts.ts` jest wspólnym źródłem receptur dla zakupów w Hangarze, cen widocznych w interfejsie oraz zwrotów przy złomowaniu i recyklingu własnego wraku. Usunięto stare ceny żelaza i poszycia z definicji modułów i uzbrojenia. Koszty rozbudowy zaplecza stacji są osobno, bez zmiany ich bilansu w tym etapie.

| Moduł | Komplet na poziom I |
| --- | --- |
| Silnik | 2 zespoły napędowe I + 1 maszyneria I |
| Dysze | 1 zespół napędowy I + 1 elektronika I |
| Ładownia | 2 poszycia stalowe I + 2 maszynerie I |
| Laser / moduł roli | 2 elektroniki I + 1 układ zasilania I |
| Kadłub | 4 poszycia stalowe I + 1 maszyneria I |
| Tarcza | 1 elektronika I + 2 układy zasilania I |

Poziomy II i III kosztują odpowiednio dwa i trzy takie komplety. Są to poziomy ulepszenia modułu, nie nowe tiery materiałowe części. Dotychczasowe efekty i specjalizacje kadłubów oraz limity zaplecza pozostają zachowane.

Impuls wymaga 3 elektronik I, 2 układów zasilania I i 1 maszynerii I. Kinetic wymaga 3 poszyć stalowych I, 2 maszynerii I i 2 układów zasilania I. Standard jest wyposażeniem bazowym kadłuba. Przełączenie posiadanego wariantu jest darmowe w bazie; zakup ani przełączenie nie działają w locie.

Brak dowolnej części blokuje całą transakcję bez częściowego obciążenia. Pierwiastki nie zastępują brakujących części. Nie zmieniono działania hipernapędu ani jego dotychczasowej receptury.

Zwrot przy złomowaniu sumuje kadłub, wszystkie poziomy modułów, każdy posiadany wariant uzbrojenia i hipernapęd, a dopiero potem zaokrągla połowę każdego rodzaju części w dół. Duplikat bezpiecznie odzyskanego uzbrojenia także daje połowę właściwej receptury. Części i kwoty nie są naliczane ponownie po powtórzeniu rozliczenia.

## Hangar

Przyciski modułów mają stałą szerokość. Wydzielony opis pod listą pokazuje efekt oraz pełne nazwy wymaganych części po wybraniu lub wskazaniu modułu. Po osiągnięciu limitu widoczny jest komunikat o limicie zamiast ceny niedostępnego poziomu. Uzbrojenie ma własny blok kosztów oraz informację o wymaganym zapleczu. Hipernapęd pozostaje oddzielnym wierszem tego samego statku.

## Zakres i dalsze prace

Format zapisu: 52. Stare zapisy są odrzucane zgodnie z ustaleniem o breaking changes.

Koszty urządzeń stacji, wymagania budowy placówek i nagrody kampanii, elementy pozyskiwane z obcych wraków oraz materiały alternatywne i części II–III są kolejnymi etapami refaktoru. Ten pakiet ich nie oznacza jako ukończonych. Muł nadal ma darmową samonaprawę.

## Weryfikacja

- Pełna regresja `npm test`: **550/550**, 0 błędów, 0 pominiętych. Obejmuje atomowość każdego brakującego składnika, skalowanie wszystkich poziomów, zwroty i duplikaty, role statków oraz długie testy stabilności. Log: `dist/equipment-full-final.log`.

- `npm run typecheck`, `npm run lint`, `npm run build` i `git diff --check`: bez błędów.
- Osobny podgląd rzeczywistego `LobbyView`, bez zapisu do profilu gracza: zakup silnika z części, nowy poziom i cena kolejnego poziomu; receptura wariantu Impuls oraz jego zakup i montaż.
- Widoki sprawdzone w 1280 × 720: opis efektu i kosztów mieści się pomiędzy listą zwykłych modułów a hipernapędem; koszty uzbrojenia mieszczą się nad głównym przyciskiem. Brak błędów konsoli.
- Zrzuty kontrolne: `dist/qa-equipment-modules.jpg`, `dist/qa-equipment-weapons.jpg`.
- Pomocnicze pliki i karta podglądu usunięte po kontroli; karta gry użytkownika pozostała nietknięta.
