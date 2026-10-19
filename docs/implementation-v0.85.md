# Wdrożenie 0.85 — urządzenia stacji z części

## Receptury i transakcje

`stationConstruction.ts` jest katalogiem kosztów rozbudowy zaplecza i urządzeń Satuk 15. Backend i interfejs korzystają z tych samych kompletów. Rozbudowa zaplecza jest osobna od ręcznej produkcji w Laboratorium i Warsztacie.

| Urządzenie | Komplet części |
| --- | --- |
| Zaplecze I | 4 poszycia stalowe I, 2 maszynerie I, 2 elektroniki I, 1 układ zasilania I |
| Zaplecze II | 8 poszyć stalowych I, 4 maszynerie I, 4 elektroniki I, 3 układy zasilania I, 2 podtrzymywania życia I |
| Generator tarczy | 6 poszyć stalowych I, 2 maszynerie I, 3 elektroniki I, 3 układy zasilania I |
| Hangar z trzema dronami | 9 poszyć stalowych I, 3 maszynerie I, 3 elektroniki I, 3 zespoły napędowe I, 3 układy zasilania I |
| Odbudowa jednego drona | 2 poszycia stalowe I, 1 elektronika I, 1 zespół napędowy I, 1 układ zasilania I |
| Tarcza kinetyczna I | 1 moduł osłonowy, 4 poszycia stalowe I, 2 elektroniki I, 2 układy zasilania I |
| Tarcza kinetyczna II | 2 moduły osłonowe, 6 poszyć stalowych I, 3 elektroniki I, 3 układy zasilania I |

Żadne aktywne urządzenie stacji nie pobiera już surowego żelaza ani krzemu jako opłaty za montaż. Brak dowolnej części blokuje całą transakcję. Pozostają wymagania technologii, raportów fabularnych, powrotu do bazy oraz maksymalnych poziomów. Magazyn jest bez limitu, a dawna rozbudowa pojemności pozostaje wyłączona.

Odbudowa mnoży recepturę przez liczbę utraconych jednostek, obciąża magazyn raz i odbudowuje tylko te jednostki. Uszkodzeni ocalali zachowują swój stan. Naprawy w hangarze nadal działają bez załogi.

## Początek kampanii

Bliskie skały z krzemem nie mogą wymagać ukończenia `earth-workshop`, skoro elektronika jest składnikiem tego zaplecza. W początkowym obszarze Ziemi są teraz gwarantowane źródła żelaza, miedzi, węgla, tlenu i krzemu. Są zwykłymi, dryfującymi skałami i podlegają normalnemu wydobyciu; nie przyznajemy gotowych części. Rozłożenie większych partii na kilka wypraw pozostaje częścią gry.

Test przechodzi rzeczywisty ciąg produkcji przy zapleczu 0: stal, rafinacja miedzi i krzemu, przewodniki, krzemionka, poszycie, maszyneria, elektronika i zasilanie, a następnie montaż zaplecza I. Oddzielny test sprawdza obecność wszystkich potrzebnych pierwiastków w początkowym obszarze.

## Interfejs

Trzy zakładki Rozbudowy stacji nadal wymieniają zawartość tego samego widoku. Wspólny blok kosztów ma dwa słupki i osobne miejsce na ikonę, pełną nazwę i licznik gotowych składników. Licznik zatrzymuje się na wymaganej ilości. Braki są złote, skompletowane pozycje miętowe. Przy odbudowie pokazany jest koszt wszystkich utraconych dronów zamiast dawnej ceny hangaru. Wszystkie główne przyciski zachowują wspólny rozmiar i linię.

## Dalszy zakres

Format kampanii: 53. Poprzednie zapisy są odrzucane.

Manifesty budowy placówek i stara para dostaw księżycowych wymagają następnego spójnego pakietu razem z etapami budowy lokalnej produkcji, uruchamianiem Muła po uzyskaniu samowystarczalności i grafiką pojawiających się modułów. Ten pakiet nie zmienia ich progresji ani nie oznacza ich jako ukończonych. Muł nadal naprawia się bez kosztów i zestawów. Muzyka `theme_loop.mp3` jest zapisana w planie, lecz nie jest jeszcze podłączona.

## Weryfikacja

- Pełne `npm test`: **557/557**, 0 błędów, 0 pominiętych; log `dist/station-full.log`.
- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`: bez błędów.
- Interfejs rzeczywistego `LobbyView` w osobnej kampanii bez zapisu: montaż zaplecza I, generatora i hangaru, zmiana wyceny po utracie dwóch dronów, ich odbudowa z zachowaniem 27 HP ocalałej jednostki. Brak błędów konsoli.
- Kontrola układu przy 1280 × 720: ikony, nazwy, liczniki i główne przyciski nie nachodzą na siebie. Zrzut: `dist/qa-station-rebuild.jpg`.
- Pomocnicza karta i pliki podglądu usunięte po kontroli; karta gry użytkownika pozostała nietknięta.
