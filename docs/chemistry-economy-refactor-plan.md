# Plan refaktoru gospodarki: pierwiastki, chemia i produkcja

Status: plan do kolejnych wdrożeń, z ustaleniami autora z 2026-10-19. Dokładne receptury i balans pozostają propozycją. Wersja 0.81 wdraża pierwszy fundament; poniższy plan nadal opisuje także zakres niewdrożony. Aktualny stan i pozostałe prace: `plan-current.md`, sekcja „Wdrożenie 0.81”.
Zakres autora zastępuje stare ograniczenia magazynu, zatrudnianie pracowników i produkcję podczas wyprawy. Bez migracji starych zapisów.

## Aktualizacja autora — paczka wyposażenia Księżyca (0.98)

Pierwsze wyposażenie placówki dostarczamy jako jeden obiekt fabularny. Zadanie pokazuje stan magazynu Satuk 15 / wymaganie dla pięciu części. Przycisk Zabierz ładunek pobiera pełen komplet, pakuje go i rozpoczyna wyprawę z paczką automatycznie podpiętą do statku. Przewóz odbywa się na holu, poza ładownią. Strata statku lub odświeżenie nie usuwa paczki ani nie wymaga ponownej produkcji: obiekt zachowuje położenie i obszar. Kontakt z bazą księżycową zalicza dostawę; dopiero wtedy pojawia się Muł. To zastępuje wcześniejszy manifest pierwszych pięciu modułów w ładowni oraz ich częściowe przekazywanie. Dalsze dostawy minerałów i inne budowy zachowują dotychczasowe zasady.

## 1. Docelowa pętla

Eksploracja → rozpoznanie składu skały → wydobycie pierwiastków → transport do bazy → przetwarzanie w laboratorium → produkcja części w warsztacie → budowa statków, ulepszeń i placówek → dalsza eksploracja.

- Ze źródeł naturalnych — skał i asteroid — zbieramy podstawowe pierwiastki. Wraki pojazdów i satelitów dostarczają konkretnych części. Usuwamy ogólną rudę, komponenty i kryształy jako kategorie wydobycia.
- Magazyn bazy jest bez limitu. Usuwamy jego poziomy, segmenty, przepełnienie, rezerwowanie miejsca i utratę nadwyżek. Nie zapisujemy Infinity jako pojemności.
- Ładownia statku zachowuje ograniczenie: dzięki temu Muł, dostawy i wybór zbieranych pierwiastków mają znaczenie. Jednostkę ładowności nazywamy miejscem, dopóki nie modelujemy masy.
- Laboratorium i warsztat obsługuje gracz podczas pobytu w bazie. Brak pracowników, kolejek mechanika, produkcji w czasie lotu i naliczania jej po wyłączeniu gry.
- Ręcznie oznacza wybranie procesu i uruchomienie partii; nie wymaga przeciągania setek atomów przy każdym powtórzeniu receptury.
- Rozbudowa stacji jest oddzielnym ekranem od produkcji. Odblokowuje procesy, precyzję warsztatu, tarcze i wyposażenie.
- Usuwamy zakładkę Załoga oraz zatrudnianie mechanika i kwatermistrza. Piloci, instruktor i postacie dialogowe zachowują swoje role.

## 2. Poprawność edukacyjna

Warstwa pośrednia powinna nazywać się Materiały, z podkategoriami: cząsteczki, materiały sieciowe, metale/stopy i polimery. Metale, stal i szkło nie są pojedynczymi cząsteczkami. SiO₂ w krzemionce opisuje proporcje atomów rozległej struktury, a nie osobne trzyatomowe kulki. Stal jest stopem o zmiennym składzie, bez jednego wzoru cząsteczki.

W konsekwencji obowiązuje pętla „pierwiastki → materiały → części”, a nie wymuszanie sztucznej cząsteczki dla każdego metalu. Miedź może przejść rafinację, żelazo i węgiel — proces otrzymywania stali, a wodór i tlen — syntezę wody.

- Pełna nazwa z symbolem wszędzie: Wodór (H), Żelazo (Fe), Glin (Al). Dotyczy HUD, ładowni, opisów skał, kosztów, dialogów, nagród i komunikatów. Wzory materiałów: Woda (H₂O), Węglik krzemu (SiC).
- Rozróżniamy pierwiastek, atom, cząsteczkę, materiał i część. Wodór jako pierwiastek H oraz gazowy wodór H₂ mają osobne, jasno objaśnione znaczenie.
- Model cząsteczki pokazuje właściwą liczbę atomów i geometrię; przykładowo woda jest kątowa. Sieć krzemionki, stop i polimer dostają odpowiednią wizualizację struktury zamiast udawanej cząsteczki.
- Każda receptura ma bilans pierwiastków, wymagany proces i ewentualne produkty uboczne. Podpowiedź o temperaturze, ciśnieniu, katalizatorze lub energii uczy, że samo zmieszanie składników nie zawsze wystarcza.
- Oddzielamy bilans chemiczny od skali produkcji gry. Wewnętrznie jednostki muszą odpowiadać stałym porcjom ilości substancji; UI może je upraszczać do porcji. Nie używamy proporcji 2 kg H + 1 kg O dla wody. Mole i przeliczenia mas można później pokazać w trybie rozszerzonym.
- Przykład dydaktyczny: 2 H₂ + O₂ → 2 H₂O. Oddzielnie pokazujemy atomowy skład jednej cząsteczki: dwa atomy wodoru i jeden tlenu. Strzałki syntezy i rozkładu nie sugerują jednakowego zapotrzebowania energetycznego.
- Zasilanie stacji zapewnia energię procesową. Na początku nie dokładamy osobnej gospodarki energią; procesy opisują jej pobór lub wydzielanie. Przetwarzanie w obie strony nie może mnożyć pierwiastków.
- Wydobywanie gotowych porcji pierwiastków to świadome uproszczenie: pokładowy separator analizuje i przetwarza urobek. Opisy nie sugerują, że asteroidy zwykle składają się z luźnych, czystych atomów.
- Hipernapęd i anomalie pozostają fikcją gry. Zastosowana obok nich rzeczywista chemia nie stanowi dowodu, że hipernapęd można zbudować w opisany sposób.

## 3. Początkowy katalog pierwiastków

Propozycja: dziewięć pierwiastków docelowo w pierwszym pakiecie, ujawnianych etapami. W pierwszych zadaniach gracz aktywnie potrzebuje około pięciu, a nie całej dziewiątki jednocześnie.

| Pierwiastek | Pierwsze zastosowanie w gospodarce |
| --- | --- |
| Wodór (H) | woda i procesy chemiczne |
| Tlen (O) | woda, obieg oddechowy i tlenki |
| Węgiel (C) | stale, tworzywa i późniejsze kompozyty |
| Żelazo (Fe) | podstawowe konstrukcje i maszyneria |
| Krzem (Si) | elektronika, krzemionka i ceramika |
| Miedź (Cu) | przewodniki i układy zasilania |
| Glin (Al) | lekkie konstrukcje i ceramika tlenkowa |
| Magnez (Mg) | lekkie stopy |
| Azot (N) | obiegi gazowe i późniejsze procesy chemiczne |

To wybór grywalnych, przydatnych pierwiastków, nie ranking najliczniejszych pierwiastków we Wszechświecie. Nikiel (Ni), tytan (Ti) i siarka (S) mogą dojść wraz z konkretnymi zastosowaniami. Hel nie jest obowiązkowym składnikiem startowego craftingu tylko dlatego, że jest częsty w kosmosie.

### Rozmieszczenie i wydobycie

- Rodziny złóż: skalne/krzemianowe, metaliczne, węgliste oraz lodowe/uwodnione. Każda ma dominujące składniki, domieszki i czytelną sylwetkę/teksturę.
- Miedź i glin nie występują na każdej skale w równych porcjach. Skaner podpowiada skład oraz kierunek poszukiwań. Warianty bogate w konkretne składniki są świadomym uproszczeniem geologii gry.
- Rozkład jest deterministyczny, ale nieregularny; aktualny dryf asteroid pozostaje. Surowce powierzchniowe zachowują swój odrębny charakter.
- **Lifting oznaczeń asteroid — wdrożony (2026-10-19):** nieregularne znaczniki zawartości na powierzchni zastępujemy kolorowymi kuleczkami pierwiastków, w zaokrąglonym stylu bez obrysów. Paleta jest wspólna z katalogiem zasobów. Kuleczki przedstawiają rzeczywistą zawartość danej skały lub odłamka, zgodną ze skanerem i urobkiem; nie są losową dekoracją.
- Szukanie właściwego złoża ma znaczenie, lecz podstawowe zadanie ma gwarantowane dostępne źródła składników. Żaden składnik pierwszego napędu nie może być osiągalny wyłącznie za pomocą tego napędu.
- Kolor pomaga rozpoznawać pierwiastek, ale zawsze towarzyszy mu nazwa i symbol. Okrągłe znaczniki i segmenty ładunku zachowujemy; dodajemy filtr zbierania poszczególnych pierwiastków obok istniejącego przełącznika całości i wyrzucania ładunku.
- Wraki statków, satelitów i innych pojazdów upuszczają nazwane części z katalogu, np. elektronikę lub poszycie określonego poziomu. Odzysk jest alternatywą dla produkcji części, nie anonimową walutą komponentów. Ocalony kadłub nadal pozostaje kadłubem. Skrytki, nagrody i recykling korzystają z tych samych identyfikatorów przedmiotów.

## 4. Materiały i procesy

Pierwsza partia katalogu powinna być mała: około 6–8 użytecznych materiałów/procesów, a nie od razu kilkadziesiąt reakcji. Każdy produkt ma zastosowanie w dostępnej konstrukcji lub otwiera bliskie zadanie.

| Przykład | Proces / prezentacja | Zastosowanie |
| --- | --- | --- |
| Woda (H₂O) | synteza, model cząsteczki | podtrzymywanie życia i chłodzenie |
| Tlen gazowy (O₂) | przygotowanie gazu, model dwuatomowy | obieg oddechowy |
| Krzemionka (SiO₂) | proces tlenkowy i formowanie, fragment sieci | szkło techniczne i izolatory |
| Oczyszczona miedź | rafinacja, struktura metaliczna | przewodniki |
| Oczyszczony krzem | oczyszczanie materiału, sieć | elektronika |
| Stal | proces metalurgiczny, mieszana struktura | poszycie i maszyneria |
| Stop glinu i magnezu | metalurgia, struktura stopu | lekkie części |
| Ceramika SiC / Al₂O₃ | późniejsze procesy, odpowiednia sieć | osłony cieplne i zaawansowane podzespoły |

Polimery mogą wejść w następnej partii po podstawach: model krótkiego łańcucha i powtarzalnego segmentu, potem uszczelnienia i przewody. Nie dopisujemy hipotetycznych reakcji tylko po to, by wypełnić drzewko. Szczegóły oraz warunki każdej receptury wymagają przeglądu merytorycznego przed wdrożeniem.

Rafinacja i obróbka metalu są pełnoprawnymi procesami, nawet jeśli nie zmieniają jego symbolu chemicznego. Nie każda czynność warsztatu jest reakcją chemiczną.

## 5. Części, warianty i tiery

Sześć proponowanych rodzin: poszycie, elektronika, maszyneria, podtrzymywanie życia, zespoły napędowe i układy zasilania. Zestawy naprawcze, ogniwa i moduły statku są nazwanymi produktami z określonym składem, nie kolejną walutą „komponenty”.

Każda rodzina ma poziomy I–III oraz warianty materiałowe. Poziom opisuje technologię i jakość wykonania, nie wyższość danego pierwiastka nad innymi. Różne materiały mogą dać ten sam typ części o innych właściwościach: masa, odporność cieplna, trwałość, wydajność.

Przykładowe ścieżki poszycia: stalowe; lekkie ze stopu glinu; zaawansowane wielowarstwowe z udziałem ceramiki. Ceramika nie jest automatycznie niezniszczalna. Ostateczny projekt części oraz balans ustalamy osobno od samego wzoru chemicznego materiału.

- Receptura statku wymienia konkretne rodziny i minimalne poziomy części.
- Ten sam poziom można uzyskać więcej niż jedną rozsądną ścieżką materiałową.
- Gracz sam wybiera użycie droższych części wyższego poziomu. Domyślnie nie zużywamy ich do prostego przepisu.
- Budowa zapisuje wybrane warianty w konfiguracji kadłuba, jeśli wpływają na jego parametry. Koszt i uzysk recyklingu odnoszą się do tego, co rzeczywiście zbudowano.
- Gotowa część ma ilustrację produktu; model molekularny jest obok na liście użytych materiałów, nie zastępuje rysunku elektroniki czy napędu.

## 6. Nowy interfejs stacji

| Widok | Zawartość |
| --- | --- |
| Rozbudowa stacji | osobno kupowane poziomy laboratorium, warsztatu, tarcz, hangaru dronów i nawigacji |
| Laboratorium | pierwiastki wejściowe, procesy, produkty chemiczne, modele i krótkie wyjaśnienia |
| Warsztat | części i materiały wejściowe, warianty, poziomy, zestawy naprawcze i wyposażenie |
| Hangar | budowa statku z listą potrzebnych części, wybór i modernizacja floty |
| Magazyn | bezlimitowe pierwiastki, materiały i części, wyszukiwanie, filtry i przypinanie |
| Tablica pierwiastków / encyklopedia | odkryte pierwiastki, nazwy, symbole, właściwości i zastosowania |

Przebieg produkcji: wybierz produkt → zobacz brakujące składniki i ich źródła → wybierz wariant → wykonaj jedną porcję → wynik. Aktualizacja autora z 2026-10-20 usuwa przyciski masowej produkcji 1/5/10/maks.; koszt i przyrost dotyczą jednej porcji receptury.

Ekran laboratorium: lista procesów z lewej; model, równanie i warunki w środku; wejście, wynik oraz liczba partii z prawej. Ekran warsztatu używa podobnego układu, ale środkiem jest ilustracja części i jej właściwości. Przy braku składnika da się przejść do jego przepisu lub zobaczyć złoże na mapie.

Pierwsze wykonanie produktu ma krótką czynność edukacyjną, np. ułożenie dwóch atomów wodoru i jednego tlenu. Błąd jest wyjaśniany i nie spala rzadkich zasobów. Kolejne partie można wykonywać bez ponownego rozwiązywania tego samego zadania. Szczegółowe równania i później mole są dodatkową warstwą wiedzy, nie barierą dla młodszego dziecka.

Nazwy z symbolami muszą mieścić się również w HUD: pokazujemy czytelną, ograniczoną liczbę wierszy lub rozwijany panel ładunku, a nie ściskamy wszystkich nazw w jednym ciągu.

## 7. Rozwój stacji i dostępność początku gry

- Nowa kampania ma działające podstawowe laboratorium i warsztat. Pierwszych części nie wolno wymagać do wybudowania jedynego urządzenia, które potrafi je zrobić.
- Pierwsza rozbudowa zaplecza jest ulepszeniem istniejącego modułu. Kolejne poziomy odblokowują procesy, precyzję, tiery i konkretne konstrukcje.
- Każdy wymagany składnik ma dostępne źródło przed zakupem blokującego go ulepszenia. Kontrolujemy to jako graf zależności.
- Magazyn nie ma płatnej rozbudowy. Stare cele i nagrody magazynowe dostają nowe funkcje, np. badania materiałowe lub rozwój urządzeń.
- Na początku wystarczy niewiele receptur: dwa materiały/metale konstrukcyjne, podstawowa elektronika, woda/gaz do podtrzymywania życia i zestaw naprawczy. Pozostałe możliwości są ujawniane wraz z zastosowaniem.
- Piloci zachowują rekrutację i progres. Istniejący koszt rekrutacji w ogólnej rudzie wymaga osobnej zamiany; propozycja na ten refaktor: kandydaci dostępni po odblokowaniach i w ramach limitów floty, bez dokładania nowej waluty.

## 8. Kampania, budowle i istniejące mechaniki

Wymagany pełny przegląd aktów I–X: cele, nagrody, koszty, opisy, odblokowania, powtarzalne dostawy i trasy. Nie pozostawiamy po refaktorze zadań żądających usuniętych komponentów.

- Stacja księżycowa powstaje etapami opisanymi poniżej. Najpierw dostarczamy gotowe podstawowe części, dopiero po uruchomieniu lokalnego przetwórstwa można aktywować Muła do zbierania materiałów na dalszą rozbudowę.
- Muł zbiera mieszanki pierwiastków, przewozi potrzebne budowie składniki i oddaje je wieloma kursami. AI zna braki manifestu oraz ograniczenie ładowni; nie zbiera bez końca przypadkowego nadmiaru jednego składnika.
- Muł jako jedyny statek ma darmową samonaprawę: bez zestawów naprawczych i bez zużywania jakichkolwiek zasobów. Dotyczy to zarówno Muła gracza, jak i Muła AI. To umowna umiejętność, nie produkcja części w terenie. Czas naprawy i częstotliwość użycia pozostają do balansu. Pozostałe statki korzystają z wcześniej przygotowanych zestawów.
- Usuwamy paliwo hipernapędu: zużycie, zbiorniki, tankowanie, receptury, koszty wodoru i wskaźniki paliwa. Posiadanie zainstalowanego hipernapędu pozwala dowolnie korzystać ze śluz. Początkowy statek nadal nie dostaje go automatycznie; odblokowanie i instalacja pozostają elementem progresji. Ewentualne wymagania poziomu napędu dla odległych tras są rozszerzeniem na później.
- Drony, tarcze, zwykłe zestawy naprawcze, prototypy, odzysk, wyposażenie i modernizacje korzystają z nazwanych części i materiałów. Usuwamy warunki „wymagany mechanik”. Automatyczne działanie już zbudowanego urządzenia nie jest produkcją surowców.
- Merkury zachowuje rolę Harpuna i odblokowanie zaawansowanych osłon. Zamiast fikcyjnego pierwiastka „Sp” można badać szczególną strukturę złoża i odblokować proces ceramiczny; zwykły urobek pozostaje z katalogu rzeczywistych pierwiastków. Ostateczny materiał i odporności to osobna decyzja projektowa.
- Początkowy Prospector i Swift oraz awaryjne odzyskanie zdolności do gry pozostają osiągalne. Strata ostatniego statku nie może wymagać wydobycia pierwiastków bez posiadania statku.

### Sektor ziemski: cztery trwałe obszary

Ziemia i Księżyc należą do jednego sektora kampanii. Obszary zachowują osobno postęp, wraki, budowę i stan świata po opuszczeniu mapy. Przelot śluzą nie rozpoczyna nowej misji ani nie resetuje obszaru.

| Obszar | Charakter | Połączenia śluzami |
| --- | --- | --- |
| A. Orbita Ziemi | Satuk 15, pierwsze zadania, podstawowe złoża | B oraz D |
| B. Orbita Księżyca | podejście do Księżyca i wejście do lotu nad powierzchnią | A oraz C |
| C. Duży klaster asteroid | rozległe złoża, wydobycie i zagrożenie dryfującymi asteroidami | B |
| D. Dalsza orbita Ziemi | liczne wraki satelitów i odzysk części | A |

Połączenia są dwukierunkowe: D ↔ A ↔ B ↔ C. Powierzchnia Księżyca jest lokalną instancją obszaru B, z wejściem i powrotem na orbitę; nie wymaga osobnego sektora kampanii. Satuk 15 pozostaje bazą przy Ziemi, a placówka księżycowa staje się drugim punktem dostaw i przetwarzania.

Obszary są oddalone od siebie i mają osobne lokalne strefy ochronne; nie łączymy ich jedną ciągłą tarczą magnetyczną. Śluzy obsługują czytelną podróż między nimi. Pierwszy napęd i dostęp do tras muszą być osiągalne ze źródeł przy Ziemi. Propozycja progresji: odzysk części w D pomaga w pierwszych dostawach na Księżyc, natomiast C otwiera późniejszą wyprawę wydobywczą z orbity Księżyca. Dokładne blokady fabularne ustalamy w manifestach aktu I.

### Etapy budowy stacji księżycowej

| Etap | Działanie gracza i warunek | Zmiana widoczna na powierzchni |
| --- | --- | --- |
| 1. Przyczółek | dostarczenie podstawowych części wyprodukowanych na Satuk 15 lub odzyskanych z wraków | platforma dostaw i centralny moduł, pierwsze połączenia |
| 2. Lokalne przetwórstwo | dostarczenie wyposażenia do zasilania, laboratorium i warsztatu; uruchomienie receptur potrzebnych dalszej budowie | moduł przetwórczy, warsztat, panele słoneczne i zbiorniki |
| 3. Wydobycie z Mułem | dopiero po osiągnięciu samowystarczalności aktywujemy Muła; eskortujemy go i możemy równolegle zbierać oraz dostarczać własny ładunek | kolejne moduły i kopuły powstające zgodnie z zatwierdzonymi etapami manifestu |
| 4. Gotowa placówka | lokalnie przetwarzamy dostarczone pierwiastki, wykonujemy części i kończymy wymagane moduły | pełny kompleks z połączonymi budynkami, zapleczem przemysłowym i infrastrukturą |

Samowystarczalność oznacza dostęp do lokalnych źródeł składników oraz urządzeń i receptur potrzebnych do dokończenia budowy. Nie oznacza produkcji w tle: chemię i części nadal wykonuje gracz podczas pobytu w tej bazie. Muł automatyzuje wyłącznie wydobycie i transport. Jego ładunek trafia do lokalnego magazynu, a pierwiastki nie zamieniają się automatycznie w części budowlane. Dotychczasowe odblokowanie Muła dla gracza po ukończeniu zadania pozostaje.

Każdy etap ma osobny manifest, zachowuje częściowe dostawy i zużywa je tylko raz. Dokładne ilości oraz przypisanie konkretnych budynków do etapów dopracujemy przy balansie. Osiągnięcie etapu aktualizuje model placówki także po powrocie do obszaru i po wczytaniu aktualnego zapisu.

Grafika: duży, czytelny kompleks widziany z góry, z centralną okrągłą budowlą, kopułami, zaokrąglonymi halami, korytarzami, zbiornikami i panelami słonecznymi. Referencje wyznaczają modułowość i skalę; wygląd przekładamy na płaskie plamy koloru, zaokrąglenia i brak obrysów zgodnie z kierunkiem graficznym gry. Kolejne moduły pojawiają się z postępem, zamiast zmiany koloru jednego prostokąta. Obszar dostaw i miejsce przelotu pozostają czytelne.

### Przedmioty, odzysk i animacje dostaw

- Wspólny katalog identyfikatorów i ikon obsługuje magazyn, ładownię, łup, przepisy, manifesty oraz transfer do obu stacji.
- Pierwiastki mają okrągłe znaczniki, przypisane kolory i etykiety z nazwą oraz symbolem. Materiały mają ilustracje właściwe ich kategorii. Części pokazują rozpoznawalny produkt, np. płytkę elektroniki, panel poszycia lub zespół maszynowy, z oznaczeniem poziomu.
- Łup z wraków jest wizualnie odróżnialny od porcji pierwiastków już w świecie gry. Nie dodajemy obowiązkowej naprawy każdej odzyskanej części jako kolejnego etapu gospodarki.
- Rozładunek do Satuk 15 i stacji księżycowej animuje ikony konkretnych przekazywanych przedmiotów, zgodne z rzeczywistym manifestem transferu. Usuwamy uniwersalne zielone kwadraty. Przy dużej dostawie można grupować ikony w partie, zachowując poprawne liczniki.
- Częściowe przyjęcie, pełna ładownia i przerwanie transferu nie mogą gubić ani powielać przedmiotów; wizualizacja odzwierciedla zatwierdzoną zmianę stanu.

## 9. Porządek wdrożenia

| Etap | Dostarczany zakres | Warunek zakończenia |
| --- | --- | --- |
| 1. Specyfikacja ekonomii | katalog pierwiastków, pierwsze procesy i części, jednostki, tabela zależności, manifest aktu I | sprawdzona poprawność chemiczna i brak zamkniętych zależności |
| 2. Nowy stan i transakcje | osobne katalogi i typy, bezlimitowy magazyn, ręczne wykonanie partii, usunięcie pracowników i ich kolejek, nowy format zapisu | atomowe zużywanie składników, kontrola bilansu, odrzucanie starych zapisów |
| 3. Wydobycie i ładownia | składy asteroid, domieszki, separator, pełne nazwy, kolory, filtry, wyrzucanie, części z wraków, wspólne ikony przedmiotów i dostaw | od wydobycia do bezstratnej dostawy każdego podstawowego pierwiastka |
| 4. Laboratorium i warsztat | nowy układ ekranów, wizualizacje cząsteczek/struktur i produktów, partie, podpowiedzi braków | gracz w bazie sam wytwarza materiały i części; lot nie produkuje niczego |
| 5. Flota i rozbudowa | budowa kadłubów z części, tiery, darmowa samonaprawa Muła, naprawy pozostałych statków, bezpaliwowe śluzy, moduły, drony i tarcze | pełny cykl zbudowania, użycia, naprawy i odtworzenia statku |
| 6. Grywalny akt I | cztery trwałe obszary Ziemi i ich trasy, tutorial chemii, etapowe manifesty księżycowe, aktywacja Muła i modułowa budowa stacji | nowa kampania przechodzi cały akt I bez debugowych dostaw |
| 7. Pozostałe akty | zamiana wszystkich kosztów, nagród i bramek, Merkury i zaawansowane procesy | zachowana przechodniość I–X, bez starych identyfikatorów ekonomii w aktywnej zawartości |
| 8. Balans i edukacja | tempo wydobycia, wyszukiwanie złóż, alternatywne receptury, czytelność modeli i tekstów | sensowne decyzje bez monotonii i obowiązkowego powtarzania identycznych ćwiczeń |

Pierwsza paczka kodu powinna objąć etapy 1–3 i minimalną ręczną produkcję umożliwiającą test pełnej pętli. Później rozwijamy docelowe ekrany i przebudowę floty. Prace prowadzić jako spójny refaktor w osobnej gałęzi. Nie wypuszczamy do zwykłej kampanii stanu mieszanego, w którym część aktów żąda już pierwiastków, a reszta nieistniejących komponentów.

## 10. Mapa techniczna i testy

Obecne miejsca powiązań:

- `state/resources.ts` — nowy katalog i nazewnictwo; proponowane osobne moduły `elements`, `materials`, `parts`, `recipes` i wykonawca transakcji.
- `state/campaign.ts` — magazyn, koszty, budowa, wyposażenie, odzysk i parser; usunięcie limitu bazy i dawnej gospodarki załogi.
- `state/crew.ts`, `config.ts` — usunięcie zatrudniania, kolejek oraz receptur opartych o rudę i anonimowe komponenty; przeniesienie potrzebnych akcji do właściwych systemów.
- `systems/mission.ts`, `systems/grippers.ts`, `systems/miningEscort.ts` — skład urobku, AI Muła, naprawy, transport, dostawy i konwersja lootu.
- `state/story.ts`, `earthLogistics`, `kineticIndustry`, `stationDrones`, `fleetUnlocks`, `missionOrders` — zależności kampanii, manifesty, nagrody i wymagania urządzeń.
- `ui/lobby.ts`, `ui/industry.ts`, `ui/missionInfo.ts`, `ui/hud.ts`, `session.ts` — nowa nawigacja, ekrany ręcznego przetwarzania, pełne nazwy, usunięcie produkcji podczas lotu.
- System obszarów świata i przejść — wspólny sektor ziemski, trwały stan czterech obszarów, graf śluz, osobna instancja powierzchni; usunięcie zależności od paliwa w stanie, HUD i podróży.
- Model placówki księżycowej — manifesty części, lokalny magazyn i dostęp do ręcznej produkcji, próg aktywacji Muła oraz renderowanie ukończonych modułów.
- Wizualizacje cząsteczek i struktur jako ilustracje w kodzie: wspólne kolory atomów, poprawne etykiety i legendy. Ikony części mają osobny katalog, spójny ze stylem gry.

Niezbędne sprawdzenia:

1. Żaden drop ani koszt nie używa starej anonimowej rudy/komponentów/kryształów; wszystkie aktywne identyfikatory są znane katalogowi.
2. Nazwy i symbole są spójne na każdym ekranie; formuły i proporcje mają weryfikację katalogową.
3. Reakcje zachowują liczbę atomów, obróbka i recykling nie tworzą materiału z niczego. Produkty uboczne nie znikają bez wyjaśnienia.
4. Zbyt duża partia, brak składnika, zmiana wariantu albo anulowanie nie prowadzą do częściowego pobrania czy duplikacji produktów.
5. Magazyn przyjmuje dowolny prawidłowy stan zasobów bez przepełnienia. Ograniczona ładownia, filtr i wyrzucanie nadal działają.
6. W czasie wyprawy nie zachodzi produkcja stacyjna. Usunięte są pozostałości zatrudnienia, timerów i rezerwowania pojemności.
7. Brak pętli wymagającej do produkcji urządzenia produktu dostępnego dopiero w tym urządzeniu. Pierwszy hipernapęd i zwykły zestaw naprawczy mają osiągalne wejścia; śluzy nie wymagają paliwa.
8. Pełne przejście aktu I, dostawy Muła, awaryjna strata statku i regresja przechodniości całej kampanii.
9. Regresja graficzna cząsteczek, sieci i ilustracji części oraz układu długich polskich nazw w HUD.
10. Muł gracza i AI naprawiają się przy zerowym zapasie zestawów i surowców; inne statki nie otrzymują tej umiejętności.
11. Wielokrotne podróże D ↔ A ↔ B ↔ C bez paliwa, z poprawnym sprawdzaniem obecności napędu; powrót z powierzchni Księżyca i trwałość stanu każdego obszaru.
12. Nie da się uruchomić Muła przed lokalnym przetwórstwem. Pełna budowa jest możliwa z dostępnych składników bez produkcji w locie; częściowe dostawy i ponowne wejście nie duplikują postępu.
13. Naturalne źródła dają pierwiastki, wraki pojazdów — konkretne części. Łup i animacje rozładunku do obu stacji używają właściwych ikon; liczby odpowiadają faktycznemu transferowi.
14. Każdy ukończony etap odsłania właściwe budynki stacji księżycowej, także po zapisie i powrocie do obszaru.

## 11. Materiały merytoryczne

Źródła do uzasadnienia modelu, nie gotowe receptury gry:

- NASA, klasy i skład asteroid: https://science.nasa.gov/solar-system/asteroids/facts/
- NASA, skład próbki Bennu i obecność związków zawierających wodę/węgiel: https://www.nasa.gov/news-release/nasas-bennu-asteroid-sample-contains-carbon-water/
- Royal Society of Chemistry, atomy, pierwiastki, cząsteczki i struktury sieciowe: https://edu.rsc.org/resources/atoms-elements-molecules-compounds-and-mixtures/617.article
- Royal Society of Chemistry, struktura metali i stopów: https://edu.rsc.org/cpd/teaching-structure-and-bonding-in-metals-at-14-16/4019916.article
- Royal Society of Chemistry, stale: https://edu.rsc.org/resources/alloys-of-iron-steels/4018479.article

Otwarte decyzje projektowe do kolejnego przeglądu, nie blokady sporządzenia planu: docelowa grupa wiekowa, skala porcji oraz pierwsze 6–8 zatwierdzonych procesów i dokładne ilości w recepturach. Do czasu doprecyzowania zakładamy prostą warstwę podstawową z opcjonalnym wyjaśnieniem dla starszych dzieci.
