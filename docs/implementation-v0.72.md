# Wersja 0.72 — księżycowy cykl misji

Data: 2026-10-18. Format kampanii **45**, dziennika **20**; poprzednie formaty są odrzucane, bez migracji.

## Raportowanie i kolejne cele

Zwiad trasy księżycowej, odbiór techniczny instalacji, fizyczne przekazanie ratowanego promu oraz zwycięstwo w obronie stacji są od razu zatwierdzane przez łączność. Dolny panel z portretem i ręcznym przechodzeniem kwestii korzysta ze sprawdzonego systemu ziemskiego. Potwierdzenie jest zapisywane, nagroda wypłacana raz; śmierć ani odświeżenie przed dokowaniem nie cofają przyjętego raportu. Odwrót nie pozwala zdobywać nowych potwierdzeń.

Po rzeczywistym odczycie zwiadu powierzchnia, podejście, złoża i Muł pojawiają się w bieżącej symulacji. Nie trzeba wracać do hangaru, aby odtworzyć sektor. Widok powierzchni, statek eskorty, nawigacja i HUD reagują na zmianę. Teren oraz Muł powstają raz; kolejne klatki nie mnożą obiektów.

Odbiór techniczny wraz z osłoną budowy pozwala rozpocząć finałową obronę. Zwycięstwo potwierdza koniec aktu I i kierunek Mars jeszcze podczas lotu. Podróż stacji do następnego sektora nadal odbywa się przez panel dowodzenia. Ratunek wymaga dowiezienia fizycznego celu — samo naprawienie promu nie wysyła raportu.

## Transfer C i budowa

C działa teraz także na orbicie Księżyca przy Satuk 15: do 650 m, poniżej 35 m/s. Na powierzchni przekazuje materiały do budowy z odległości do 300 m. Animacja trwa 2,4 s, ruch, ostrzał lub obrażenia mogą ją przerwać. Przed zakończeniem transferu materiały pozostają na statku. E przy placu budowy pozostaje dostępne jako dotychczasowa forma dostawy.

Budowa przyjmuje aktualnie potrzebną rudę lub komponenty, w dowolnej liczbie częściowych dostaw. Muł AI i gracz używają wspólnego licznika. Jeśli Muł dowiezie część brakującej rudy, gracz przekaże tylko resztę; nadmiar zachowa na statku. Zwykłe kursy Muła nie otwierają rozmowy co dostawę — radio ogłasza ukończenie etapu. Dostawy gracza i obrona asteroidowa otrzymują potwierdzenia.

Materiał przekazany do Satuk 15 nie jest drugi raz wpłacany przy dokowaniu. Rudy wydobyte i przekazane wcześniej, także do budowy przez E lub C, uwzględniane są raz w XP po udanym powrocie. Ładunek zabrany z magazynu jest odliczany od manifestu i nie daje doświadczenia za wydobycie. Dostawy Muła nie dają graczowi XP za własne wydobycie. Przy pełnym magazynie nieprzyjęty nadmiar pozostaje na statku.

Poprawiono również rozliczanie powrotu: nie zmienia ono przekazanego przez wywołującego obiektu ładunku. Raporty, surowce i nagrody pozostają rozdzielone; powrót po radiowym potwierdzeniu nie wypłaca tej samej premii ponownie.

## Weryfikacja

**483/483 testy**. Pięć nowych prób obejmuje rzeczywisty skan i odblokowanie powierzchni z Mułem w jednym locie, wspólne dostawy i zwrot nadmiaru frachtu bez XP, doświadczenie za wydobyty materiał dostarczony wcześniej, odbiór techniczny bez dokowania oraz blokadę raportowania po odwrocie i stary format.

Dotychczasowe próby obejmują zwykły lot Prospectora, wydobycie miedzi, powtarzane kursy Muła, naprawę i holowanie promu, asteroidową osłonę budowy oraz rzeczywiste fale AI. Zmieniono oczekiwania wymagające wcześniej bezpiecznego powrotu z księżycowym raportem. Próba odtworzenia zapisu po zwycięstwie kontroluje teraz zachowanie ukończonego aktu i nagrody.

W przeglądarce sprawdzono skan przez E, automatyczne potwierdzenie, nowe cele i HUD Muła, a osobno animację transferu C na powierzchni, dostawę 24 Fe i pozostawienie niepotrzebnych jeszcze komponentów na statku. Konsola bez błędów i ostrzeżeń. Użyto osobnych kampanii QA oraz przygotowanych pozycji i ładunku; nie było to ciągłe przejście całej kampanii.

## Dalej

Cykl łączności i transferu obejmuje Ziemię oraz Księżyc. Akty II–X zachowują wcześniejsze raportowanie i otrzymają osobne wdrożenia z kontrolą liczników patroli oraz etapów walk. Następny pakiet początku gry to drugi Prospector AI prowadzący gracza przy Ziemi, reagujący na aktualny cel, utratę kontaktu i własne zniszczenie bez blokowania kampanii.
