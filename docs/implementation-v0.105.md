# Wdrożenie 0.105 — części II–III

Data: 2026-10-21. Aplikacja 0.105.0; kampania 66, dziennik 29. Zmiana wycen i zwrotów odrzuca poprzednie formaty kampanii zamiast tworzyć z dawnych inwestycji części wyższej wartości. Brak automatycznej migracji.

## Katalog i produkcja

Dodano czternaście części i receptur: poszycie stalowe II/III, poszycie lekkie II/III, elektronika II/III, maszyneria II/III, podtrzymywanie życia II/III, zespół napędowy II/III oraz układ zasilania II/III. Wspólny katalog zasobów obsługuje ich magazynowanie, ładownię, koszty, transfer i zapis.

Zaplecze 0 zachowuje dotychczasowe receptury podstawowe. Zaplecze I odblokowuje części II, a zaplecze II — części III. Ukończona placówka księżycowa zachowuje lokalny poziom zaplecza I i może tworzyć części II; części III wymagają Satuk 15 z zapleczem II. Produkuje się ręcznie jedną porcję. Brak automatycznego zastępowania części niższych wyższymi.

Każda receptura II zużywa jedną część I, a każda III jedną II oraz poniższe dodatki. To montaż i obróbka urządzeń z istniejących materiałów, nie nowe równania chemiczne ani nowy pierwiastek „wyższego poziomu”.

| Rodzina | Dodatki do poprzedniego tieru dla II | Dodatki do poprzedniego tieru dla III |
| --- | --- | --- |
| Poszycie stalowe | 2 stal, 1 krzemionka | 2 stal, 1 stop Al–Mg, 2 krzemionka |
| Poszycie lekkie | 1 stop Al–Mg, 1 krzemionka | 2 stop Al–Mg, 1 stal, 2 krzemionka |
| Elektronika | 2 oczyszczony krzem, 2 przewodniki | 3 oczyszczony krzem, 2 przewodniki, 2 krzemionka |
| Maszyneria | 2 stal, 1 elektronika I | 2 stop Al–Mg, 1 elektronika II |
| Podtrzymywanie życia | 1 woda, 1 tlen gazowy, 1 elektronika I | 1 woda, 1 tlen gazowy, 1 elektronika II |
| Zespół napędowy | 1 maszyneria II, 1 elektronika I | 1 maszyneria III, 1 elektronika II |
| Układ zasilania | 1 elektronika II, 2 przewodniki | 1 elektronika III, 2 przewodniki |

## Zastosowania i odzysk

Kadłuby mają sześć wymaganych rodzin. Tier każdej odpowiada wymaganemu zapleczu projektu + 1. Prospector i Swift pozostają na I; kadłuby wymagające zaplecza I korzystają z II, a wymagające zaplecza II z III. Sokół, Widmo, Żądło i Feniks wymagają lekkiego poszycia, pozostałe stalowego. Ich dotychczasowe parametry pozostają własnością projektu; nie dodano jeszcze ekranu wyboru materiału ani ukrytych bonusów materiałowych.

Moduły statku I/II/III wymagają odpowiednio części I/II/III. Ilości bazowego kompletu pozostają stałe, zamiast starego mnożenia całej liczby części I przez kolejny poziom. Drugie zaplecze wymaga 8 poszyć stalowych II, 4 maszynerii II, 4 elektronik II, 3 układów zasilania II i 2 podtrzymywania życia II. Wszystkie te części są osiągalne na zapleczu I. Pierwsze zaplecze i księżycowa paczka początku gry zachowują części I.

Koszt w podglądzie i płatność korzystają z tych samych definicji. Zezłomowanie i odzysk własnego wraku zwracają połowę rzeczywistych rodzin i tierów wymaganych przez projekt oraz zamontowane moduły, po zsumowaniu inwestycji. Standardowy napęd nadal nie jest płatną inwestycją. Uzbrojenie, generatory i drony zachowują swoje dotychczasowe komplety, jeżeli nie mają osobnego poziomu technologicznego.

## Ilustracje i warsztat

Każdy nowy tier ma własną ilustrację wektorową, używaną również w małych ikonach kosztów i magazynu:

- Poszycie II: profilowane żebra. III: trzy segmenty warstwowe z zewnętrznymi mocowaniami.
- Elektronika II: dwa sterowniki i pionowe ścieżki. III: trzy sterowniki, dodatkowa płyta i szyna.
- Maszyneria II: zabudowana przekładnia. III: trzy zazębione elementy w większej ramie.
- Podtrzymywanie II: zbiorniki ze sterownikiem i zaworami. III: szerszy zespół z trzema filtrami.
- Napęd II: dwie dysze. III: trzy dysze i dodatkowa sekcja sterująca.
- Zasilanie II: dwa oddzielne moduły na szynie. III: trzy moduły i boczne przyłącza.

Rodzinne kolory pozostają, ale różnica tierów nie zależy wyłącznie od barwy lub dopisanego numeru. Warsztat ma przełączniki I/II/III, które zachowują wybraną rodzinę. Pod tierem I pozostają również zestaw naprawczy, przewodniki i specjalistyczne osłony. Skróty „Stwórz” prowadzą do dokładnej receptury wejściowej; „Powrót” przywraca wcześniejszy przepis i jego tier. Cztery wiersze składników mieszczą się nad opisem. Blokada technologiczna ma pierwszeństwo przed komunikatem o brakujących materiałach.

## Weryfikacja

41 zaliczonych testów: katalog i produkcja, grafu zależności od surowców, braku częściowego pobierania, blokad zaplecza i lotu, dokładnych kosztów modułów, wszystkich projektów kadłubów, zwrotów i zapisu. Zaktualizowano wcześniejsze fixture'y produkcji i odzysku do bieżących API i właściwych tierów. Pierwszy statek i zaplecze nadal dają się wykonać z początkowych złóż.

Kontrola typów, lint zmienionych plików i build release. W osobnej karcie sprawdzono produkcję III, przejście do składnika II, powrót, blokadę przy zapleczu 0 i planszę 21 ilustracji. Podgląd: `dist/parts-tiers-105.png`. Karta gry użytkownika nie była przeładowywana.

Pozostają dalsze warianty materiałowe, zapis ich wpływu na konstrukcję i balans czasu produkcji w dłuższej rozgrywce. Ta paczka nie dodaje sztucznej chemii ani dowolnej zamiany materiałów w już posiadanym kadłubie.
