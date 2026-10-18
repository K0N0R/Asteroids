# Eksploracja, dryf i logistyka — 0.80

## Wdrożone

- Początkowe pola nie używają siatki 3×3. Końcowe rozmieszczenie orbitalnych złóż ma deterministyczne rozproszenie i próby zachowania odstępów. Specjalny materiał Merkurego również ma nieregularny układ.
- Każda asteroida orbitalna jest dynamiczna. Zwykłe skały mają różne prędkości przelotu, duże metaliczne skały i specjalne złoża Merkurego dryfują bardzo wolno. Uderzenia zachowują pęd; zatrzymana asteroida odzyskuje minimalny dryf. Usunięte wymuszanie lokalnej orbity i powrotu do środka małego pola.
- Po wyjściu poza promień sektora z marginesem minimum 400 m asteroida pojawia się poza przeciwną krawędzią, z losowym przesunięciem i kursem przecinającym sektor. Poprzednia pozycja interpolacji jest resetowana, więc nie ma smugi przez mapę. Złoża powierzchniowe Księżyca i skały jego obrony są obsługiwane osobno.
- Dekoracyjny wrak ma rozpoznawalny kadłub, uszkodzoną kabinę, panele, oderwany napęd i drobne szczątki. Usunięty wielki okrąg wokół dwóch przypadkowych wielokątów.
- Zebrane pierwiastki i inne materiały są okrągłe, także w chwytaku. Kolor jest wspólny z definicją zasobu i segmentem paska ładowni. Wodór H pochodzi z rozbitych skał krystalicznych, dawny ogólny zasób kryształów ma nazwę krzem Si.
- O przełącza automatyczne rozpoczynanie zbierania; chwytaki kończą pracę rozpoczętą wcześniej. B wybiera rodzaj ładunku, X wyrzuca do pięciu jednostek za statek. Wyrzucenie wyłącza nowe zbieranie, aby gracz nie podniósł od razu tego samego materiału. Surowiec pozostaje fizycznie do odzyskania w bieżącej wyprawie.
- Statek początkowy oraz nowo kupione kadłuby nie mają hipernapędu. Przemysł → Paliwo pozwala mechanikowi zamontować i rozwijać moduł I–III za Fe, komponenty i moduły zasilania. Pojemności to 3/4/5 ogniw. Montaż nie daje paliwa gratis. Ogniwa produkuje się z 6 H i 1 komponentu: 3 ogniwa w 45 s. Dwa pobliskie złoża zapewniają pierwszą partię H w lokalnej osłonie, bez wcześniejszego napędu. Tankowanie i ulepszenia wymagają pobytu w bazie i dotyczą wybranego statku.
- HUD zawsze pokazuje ilość paliwa/pojemność lub brak modułu. Usunięte cienie tekstów HUD i obrysy liter, które utrudniały czytelność i potrafiły powodować znikanie napisów.
- Pierwsza sieć magnetyczna działa przy Ziemi po uruchomieniu warsztatu: strefa Satuk 15, dotychczasowy przekaźnik orbitalny oraz dwa kolejne przekaźniki. E synchronizuje dodatkowy przekaźnik; południowy wymaga warsztatu II. Strefy i stan węzłów widać na radarze. Rozbudowa nie łączy lokalnej osłony z odległym metalicznym złożem: pomiędzy nimi pozostaje strefa ekspozycji. Lot hipernapędem pokonuje ją bez naliczania obrażeń od ekspozycji, ale kolizja nadal niszczy statek.
- Celownik zastępuje kursor na obszarze lotu. Laser kończy się dokładnie na kursorze, pierwszej przeszkodzie lub maksymalnym zasięgu. Szczęki Harpuna dopasowują odległość do kursora bez wymuszonego minimalnego zasięgu; ich końcówki nie przekraczają zadanego promienia.

## Zapis

Kampania **49**, dziennik **21**. Wymagana nowa kampania; brak migracji. Poziom napędu, paliwo i aktywowane dodatkowe przekaźniki zapisują się trwale.

## Dalsze rozwinięcie

Pierwsza sieć stref dotyczy Ziemi. Kolejne sektory mogą użyć tego samego modelu dla pól generowanych przez okręty przeciwników, obce jednostki i skażenia; te warianty nie są jeszcze nową zawartością gry. Ulepszenia hipernapędu zwiększają obecnie pojemność, a nie wydajność produkcji wodoru. Wyrzucony zwykły ładunek nie jest zapisywany po zakończeniu wyprawy.

## Weryfikacja

Regresje obejmują wszystkie generatory sektorów, rzeczywisty ruch Rapiera, zatrzymanie po kolizji i ponowne podjęcie dryfu, recykling poza ekranem, zachowanie zasobów przy wyrzucaniu, poziomy i koszty napędu, rozdzielenie stref oraz zakończenie promienia na kursorze. Starsze automaty lotu śledzą teraz bieżące pozycje asteroid i cieni. Próby samych terminali, nagród bossa i labiryntu skażenia izolują dodatkowe losowe kolizje od sprawdzanej mechaniki.

Wynik: **523/523** pełnej regresji. Po ostatnich korektach: **38/38** testów zmienionych obszarów oraz **15/15** testów napędu i stref. Typecheck, ESLint i build produkcyjny. Podgląd przeglądarkowy potwierdza czytelność HUD bez cieni, licznik paliwa, kolorowy ładunek, wyłączanie zbierania i wyrzucanie okrągłych porcji surowca; konsola bez ostrzeżeń i błędów.

## Dalsza korekta oprawy

Kontynenty Ziemi korzystają z zaokrąglonych krzywych bez obrysu. Droga Mleczna jest szerokim, nieregularnym pasem z ponad 23 tysiącami drobnych gwiazd, skupiskami, kieszeniami emisyjnymi i rozgałęzionymi pasmami pyłu. Dekoracja jest jednorazowo składana do tekstury; detale nie są przeliczane w każdej klatce. Położenie i obrót paralaksy pozostały bez zmian.

Po porównaniu z referencją fotograficzną zastąpiono powyższe wstęgi jedną proceduralną teksturą chmury gwiazd. Wieloskalowy szum tworzy płynne brzegi, jasne ciepłe centrum i nieregularną absorpcję pyłu; nie ma wyciętych geometrycznych pasów. Tekstura powstaje raz podczas inicjalizacji tła i jest zwalniana razem z nim. Regresja projekcji 4/4, typecheck, ESLint i build przeszły; podgląd lotu bez błędów konsoli.
