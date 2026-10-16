# Implementacja 0.63 — stocznia polowa przeciwnika

Pierwsza baza produkująca jednostki pojawia się **przy Marsie po ukończeniu Śladu pościgu i Zabezpieczenia podejścia**. Opcjonalny rozkaz **Zatrzymaj produkcję** nie blokuje głównej trasy kampanii. **5** wskazuje stocznię; wybrany rozkaz automatycznie ustawia ten cel nawigacji. Można również zniszczyć ją podczas swobodnego lotu.

## Produkcja i walka

Zbliżenie na **1200 m** lub trafienie uruchamia produkcję. Pierwszy start następuje po **6 s**, kolejne co **14 s**. Stocznia wypuszcza drony patrolowe, a co trzecią jednostką jest Lancer. Jednocześnie działa najwyżej **4** jej jednostek. Usunięcie jednostki zwalnia miejsce, ale nie powoduje odtworzenia zaległych fal. Wszystkie miejsca startowe są sprawdzane pod kątem fizycznych przeszkód; zajęty hangar czeka zamiast tworzyć statki wewnątrz innych obiektów.

Rdzeń ma **900 HP** i rzeczywisty collider: blokuje ruch i pociski. Można uszkadzać go standardową bronią, wiązkami, wybuchami, szczękami Harpuna i ostrzami Widma. Ostrzał przeciwników nie uszkadza własnej bazy. Zniszczenie rdzenia natychmiast usuwa collider i zatrzymuje produkcję; wcześniej wypuszczone jednostki nie znikają. Ruiny zastępują aktywną konstrukcję.

Jednostki produkowane nie zostawiają rudy, komponentów ani kadłubów do odzysku; zapobiega to nieskończonemu wytwarzaniu zasobów przez odkładanie zniszczenia stoczni. Zwykłe statystyki walki nadal je liczą, lecz nie zwiększają liczników fabularnych patroli. Nie dodano nowych klas wrogów — ten pakiet wykorzystuje istniejące drony i Lancery.

## Raport i trwałość

Samo podejście lub E nie wykonuje zadania. Raport pojawia się dopiero po fizycznym zniszczeniu rdzenia. Własny bezpieczny powrót przyznaje jednorazowe **28 Fe i 8 komponentów** i utrwala wyłączenie produkcji. Kolejne wizyty pokazują ruiny bez nowych startów. Zniszczenie bez dostarczenia raportu, śmierć, odświeżenie lub odwrót nie potwierdzają wykonania celu — kolejna próba odtwarza bazę.

Wybrany rozkaz stosuje dotychczasową blokadę dokowania do wykonania celu i umożliwia odwrót przez TAB. Starsze zadania Marsa i przejście do aktu V pozostają niezależne od dodatkowej stoczni.

## Oprawa

Osobna sylwetka stoczni i ruin, pasek kadłuba, kontrolka pracy, licznik do startu i liczba aktywnych jednostek. Opisy i paski obracają się przeciwnie do kamery i pozostają poziome. Radar oznacza aktywną bazę czerwonym kwadratem. HUD wskazuje rdzeń i konieczność powrotu z raportem.

## Zapis

Format kampanii **40**, dziennika **19**. Starsze formaty są odrzucane, bez migracji. Brak zapisu częściowych uszkodzeń bazy i wznawiania aktywnego lotu.

## Weryfikacja

**422/422 testów**, bez pominięć. Typecheck, lint, produkcyjny build i kontrola diff przechodzą. Końcowy build usuwa tymczasową stronę i bundle QA.

- Pełna zwykła wyprawa bazowym Prospectorem: dolot, walka z co najmniej dwoma rzeczywiście wyprodukowanymi wrogami, zniszczenie rdzenia standardową bronią, bezpieczny powrót, jednorazowa nagroda i ponowny lot do trwale wyłączonej bazy. Przygotowany legalny postęp do otwarcia dalszego obszaru Marsa; bez teleportowania i ręcznego dodawania raportu podczas wyprawy.
- Test modelu sprawdza lokalne uruchomienie, odstępy, blokadę miejsc startowych, limit jednostek, ponowną produkcję po zwolnieniu miejsca oraz zatrzymanie startów bez kasowania istniejących wrogów.
- Próby fizyki sprawdzają brak zaliczenia przez E, brak uszkodzeń od własnych jednostek, odrzucenie raportu po odwrocie, ponowienie zadania oraz trafienia laserem i wybuchem rakiety bez dodatkowych dropów materiałowych.
- Zaktualizowany test dziennika Marsa uwzględnia dodatkową opcjonalną misję i nadal sprawdza oddzielenie celów aktów II i V.
- Przeglądarka: wybór nowego rozkazu, sylwetka stoczni, poziome opisy i paski podczas obrotu kamery, odliczanie i wypuszczenie jednostki. Sprawdzono widok pełny i zwężony z zachowaniem proporcji gry. Brak błędów konsoli. Scena QA ustawia bazowego gracza przy stoczni, bez wyłączania produkcji ani przeciwników. Nie potwierdza pełnego ręcznego zwycięstwa — pełną wyprawę z walką, zniszczeniem i raportem potwierdza test symulacji. Tymczasowa strona i bundle są usuwane przez końcowy build.

[Widok aktywnej stoczni](validation-v0.63/factory-active.jpg).

## Kolejny krok

Moduł dronów strażniczych Satuk 15: patrol najbliższego obszaru, wsparcie walki i współpraca z generatorem tarczy. Następnie dalsze role przeciwników i rozwijanie poszczególnych sektorów.
