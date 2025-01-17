gsap.registerPlugin(Draggable, Flip);

class Home {
  constructor() {
    this.initDOM();
    this.initFilters();
    this.initViews();
    this.guiVal = {
      throttleInterval: 100,
      scaleTarget: 0.6,
      durationTarget: 1,
      threshold: 400,
    };
    this.isPristine = false;
    this.isXPView = true;
    this.allItems = [];
    this.removedItems = [];

    // Initialize everything
    // this.calculateGridSize();
    this.setupDraggable();
    this.initEvents();
    this.resize();
    this.moveGridInitialPos();
    this.initGUI();

    //GUI
  }

  initDOM() {
    // grid
    // this.grid = document.querySelector(".section_collection");
    this.pageWrapper = document.querySelector(".page-wrapper");
    this.gridWrapper = document.querySelector(".main-wrapper");
    this.xpWrapper = document.createElement("div");
    this.xpWrapper.classList.add("xp-wrapper");
    this.xpSectionCollection = document.createElement("div");
    this.xpSectionCollection.classList.add("xp_section_collection");
    // const clone = document.querySelector(".main-wrapper").cloneNode(true);
    // this.immutableNode = clone.outerHTML;
    this.pageWrapper.classList.toggle("screen-height");
    this.gridWrapper.classList.toggle("hidden");
    this.xpWrapper.appendChild(this.xpSectionCollection);
    this.pageWrapper.appendChild(this.xpWrapper);

    // Items
    this.filteredItems = Array.from(
      document.querySelectorAll(".products-collection_item")
    );
    this.itemsCard = Array.from(
      document.querySelectorAll(".collection_item-card")
    );
    this.first = [];
    this.other = [];

    // Focus mode
    this.carouselFocus = document.getElementById("carouselFocus");

    this.initLazyImages();
    this.initNotFound();

    // this.gap = 60; // Gap between items

    this.reconstructDOM();

    console.log(this.filteredItems);
    this.toggleCardVisible();
    this.prefixeClasses(true);
    // this.filteredItems = Array.from(document.querySelectorAll('.item'))
  }
  initViews() {
    this.viewButton = document.createElement("button");
    this.viewButton.classList.add("viewButton");
    this.viewButton.innerHTML = "grid view";

    this.viewButton.addEventListener("click", this.toggleView.bind(this));
    this.pageWrapper.appendChild(this.viewButton);

    this.orderedCollections = {};

    this.filteredItems.forEach((el) => {
      const collection = el.getAttribute("data-collection"); // Récupère la collection

      // If it's the first element
      if (!this.orderedCollections[collection]) {
        this.orderedCollections[collection] = [];
        el.classList.add("first");
        this.first.push(el);
      } else {
        el.classList.add("other");
        this.other.push(el);
      }

      this.orderedCollections[collection].push({ el });
    });
    console.log(this.orderedCollections);
  }

  initFilters() {
    // Controls and filters
    const controls = document.createElement("div");
    this.colorFilter = document.createElement("select");
    this.typeFilter = document.createElement("select");
    this.sizeInput = document.createElement("input");
    const colorsList = document.getElementById("colors-list");
    const typesList = document.getElementById("types-list");
    const colors = Array.from(colorsList.querySelectorAll("[data-color]"));
    const types = Array.from(typesList.querySelectorAll("[data-type]"));
    this.isSizeTouched = false;

    // Extraire les valeurs uniques de data-size
    this.sizes = [
      ...new Set(
        [...this.filteredItems].map((item) =>
          parseFloat(item.getAttribute("data-size"))
        )
      ),
    ];
    this.sizes.sort(function (a, b) {
      return a - b;
    });

    // Buttons
    this.filterButton = document.createElement("button");
    this.resetButton = document.createElement("button");
    this.filterButton.classList.add("filterButton");
    this.resetButton.classList.add("resetButton");
    this.filterButton.innerHTML = "Filter";
    this.resetButton.innerHTML = "Reset";

    // Range
    this.sizeInput.type = "range";
    this.sizeInput.value = "0";
    this.sizeInput.min = "0";
    this.sizeInput.max = this.sizes.length;
    this.sizeInput.step = "1";
    this.sizeInput.id = "sizeInput";

    controls.classList.add("controls");
    this.colorFilter.id = "colorFilter";
    this.typeFilter.id = "typeFilter";

    this.createSelect(this.colorFilter, colors, "color");
    this.createSelect(this.typeFilter, types, "type");

    controls.appendChild(this.colorFilter);
    controls.appendChild(this.typeFilter);
    controls.appendChild(this.sizeInput);
    controls.appendChild(this.filterButton);
    controls.appendChild(this.resetButton);
    this.xpWrapper.appendChild(controls);

    colorsList.remove();
    typesList.remove();
  }

  initLazyImages() {
    // Sélectionne toutes les images avec la classe "lazy-image"
    const lazyImages = document.querySelectorAll("img");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1;
          entry.target.style.transition = "opacity 0.5s ease-in-out";
          observer.unobserve(entry.target); // Stop observer une fois chargé
        }
      });
    });

    // Initialisez toutes les images avec opacity 0
    lazyImages.forEach((img) => {
      img.style.opacity = 0;
      observer.observe(img);
    });
  }

  initNotFound() {
    this.notFound = document.createElement("div");
    this.notFound.classList.add("not_found");
    const reset = document.createElement("button");
    const text = document.createElement("p");
    reset.innerText = "reset filter";
    text.innerText = "No products found..";

    reset.addEventListener("click", this.handleReset.bind(this));

    this.notFound.appendChild(text);
    this.notFound.appendChild(reset);
    this.xpWrapper.appendChild(this.notFound);
  }

  createSelect(select, array, data) {
    // all
    const all = document.createElement("option");
    all.value = "all";
    all.innerHTML = "All";
    select.appendChild(all);

    // colors
    array.forEach((el, i) => {
      const opt = document.createElement("option");
      opt.value = el.dataset[data];
      opt.innerHTML = el.dataset[data];
      select.appendChild(opt);
    });
  }

  initEvents() {
    this.sizeInput.addEventListener("input", () => {
      this.selectedSize = this.sizes[this.sizeInput.value];
      console.log(this.selectedSize);
      this.isSizeTouched = true;
    });
    this.filterButton.addEventListener(
      "click",
      this.handleFiltering.bind(this)
    );
    this.resetButton.addEventListener("click", this.handleReset.bind(this));
    // Throttle mousemove event
    if (!isMobile()) {
      this.throttledMouseMove = throttle(
        this.updateScales.bind(this),
        this.guiVal.throttleInterval
      ); // 50ms interval
      window.addEventListener("mousemove", this.throttledMouseMove);
    }
  }

  // DRAGGABLE

  moveGridInitialPos() {
    gsap.set(".xp_section_collection", {
      x:
        (this.xpWrapper.offsetWidth - this.xpSectionCollection.offsetWidth) / 2, // Décalage initial de 750px vers la gauche
      y:
        (this.xpWrapper.offsetHeight - this.xpSectionCollection.offsetHeight) /
          2 -
        50, // Aucun décalage vertical
    });
  }
  moveGridLeft() {
    gsap.set(".xp_section_collection", {
      x:
        (this.xpWrapper.offsetWidth - this.xpSectionCollection.offsetWidth) / 2, // Décalage initial de 750px vers la gauche
      y:
        (this.xpWrapper.offsetHeight - this.xpSectionCollection.offsetHeight) /
          2 -
        50, // Aucun décalage vertical
    });
  }

  // GSAP Draggable with dynamic bounds
  setupDraggable() {
    Draggable.create(".xp_section_collection", {
      type: "x,y",
      bounds: {
        minX:
          this.xpWrapper.offsetWidth -
          this.xpSectionCollection.offsetWidth +
          50, // Include padding
        maxX: -50, // Include padding
        minY:
          this.xpWrapper.offsetHeight -
          this.xpSectionCollection.offsetHeight +
          50,
        maxY: -50,
      },
      edgeResistance: 0.9,
    });
    //console.log(0.5 * (this.xpWrapper.offsetWidth - this.grid.offsetWidth + 50))
  }
  resetDraggable() {
    // Update draggable bounds
    Draggable.get(".xp_section_collection")?.applyBounds({
      minX:
        this.xpWrapper.offsetWidth - this.xpSectionCollection.offsetWidth + 50,
      maxX: -50,
      minY:
        this.xpWrapper.offsetHeight -
        this.xpSectionCollection.offsetHeight +
        50,
      maxY: -50,
    });
  }

  // FLIP

  // Animate changes
  flipOnFilter(state) {
    Flip.from(state, {
      duration: 0.8,
      ease: "cubic.inOut",
      stagger: 0.02,
      onComplete: () => {
        gsap.to(this.filteredItems, {
          scale: 1,
          // duration: 1,
          // ease: "bounce.out",
        });
      },
    });
  }
  // Animate changes
  flipOnFocus(state) {
    Flip.from(state, {
      duration: 0.8,
      ease: "cubic.inOut",
    });
  }

  // Animate changes
  flipToGrid(state) {
    Flip.from(state, {
      duration: 3,
      ease: "cubic.inOut",
      // absolute: true,
      onComplete: () => {
        // Make UI appear here
        this.toggleCardVisible();
        console.log("Transition terminée");
        gsap.to(this.other, {
          scale: 1,
          display: "flex",
          duration: 0,
        });
        this.createDrag();
      },
    });
  }
  // Animate changes
  flipToXp(state) {
    Flip.from(state, {
      duration: 3,
      ease: "cubic.inOut",
      // absolute: true,
      onComplete: () => {
        gsap.to(this.other, {
          scale: 1,
          overwrite: true,
        });
        window.addEventListener("mousemove", this.throttledMouseMove);
      },
    });
  }

  // FILTERS

  handleReset(e) {
    this.isSizeTouched = false;
    // e.preventDefault()
    this.colorFilter.value = "all";
    this.typeFilter.value = "all";
    this.sizeInput.value = "";
    this.handleFiltering(e);
    this.hideNotFound();
  }

  handleFiltering(e) {
    e.preventDefault();
    this.selectedColor = this.colorFilter.value;
    this.selectedType = this.typeFilter.value;

    // Maybe not each time ?
    this.hideNotFound();

    // Capture state before filtering

    this.sort().then(
      () => {
        gsap.to(this.removedItems, {
          scale: 0,
          stagger: 0.01,
          overwrite: true,
          // duration: 3,
          ease: "cubic.inOut",
          onComplete: () => this.animateDomUpdate(),
        });
        console.log(this.filteredItems.length);
        if (this.filteredItems.length === 0) this.showNotFound();
      },
      (error) => {
        /* code if some error */
      }
    );

    // Update grid size after filtering
    // this.calculateGridSize();
  }
  calculateGrid() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportRatio = viewportWidth / viewportHeight;
    // Exemple d'utilisation
    let bestCols = 1;
    let bestRows = this.filteredItems.length;
    let bestDiff = Infinity;

    for (let cols = 1; cols <= this.filteredItems.length; cols++) {
      const rows = Math.ceil(this.filteredItems.length / cols);
      const gridRatio = cols / rows;
      const diff = Math.abs(gridRatio - viewportRatio);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestCols = cols;
        bestRows = rows;
      }
    }

    console.log(bestCols, bestRows);

    return { cols: bestCols, rows: bestRows };
  }

  async sort() {
    console.log(this.isPristine);
    if (this.isPristine) {
      Array.from(
        document.querySelectorAll(".products-collection_item")
      ).forEach((item, i) => {
        const matches = this.itemMatches(item);
        console.log(matches);
        if (!matches) {
          this.removedItems.push(item);
          this.filteredItems.splice(i, 1);
        } else {
          this.filteredItems.push(item);
        }
      });
    } else {
      this.filteredItems = this.filteredItems.filter((item) => {
        const matches = this.itemMatches(item);
        if (!matches) {
          this.removedItems.push(item); // Ajouter les éléments non correspondants à `removedItems`
        }
        return matches; // Garder les éléments correspondants
      });
      this.removedItems = this.removedItems.filter((item) => {
        const matches = this.itemMatches(item);
        if (matches) {
          this.filteredItems.push(item); // Ajouter les éléments non correspondants à `removedItems`
        }
        return !matches; // Garder les éléments correspondants
      });
    }
    console.log("filtered ", this.filteredItems);
    console.log("removed ", this.removedItems);
    this.isPristine = false;
    console.log("end");
  }

  itemMatches(item) {
    const matchesColor =
      this.selectedColor === "all" || item.dataset.color === this.selectedColor;
    const matchesType =
      this.selectedType === "all" || item.dataset.type === this.selectedType;
    const matchesSize =
      !this.isSizeTouched || parseFloat(item.dataset.size) == this.selectedSize;
    // console.log(matchesSize);
    console.log(matchesColor, matchesType, matchesSize);
    return matchesColor && matchesType && matchesSize;
    // return matchesType; //&& matchesSize;
  }

  animateDomUpdate() {
    this.state = Flip.getState(".products-collection_item, .column");

    this.reconstructDOM();
    this.xpSectionCollection = this.newGrid;

    this.resetDraggable(), this.moveGridLeft();

    this.flipOnFilter(this.state);
  }

  reconstructDOM() {
    // this.removedItems.forEach(item => item.remove())
    this.newGrid = this.xpSectionCollection;
    this.newGrid.innerHTML = "";

    const columns = [];
    const dimensions = this.calculateGrid();
    console.log(`Colonnes: ${dimensions.cols}, Lignes: ${dimensions.rows}`);

    for (let i = 1; i <= dimensions.cols; i++) {
      const column = document.createElement("div");
      column.className = "column";
      columns.push(column);
    }
    var nbTour = 0;
    var add = 0;

    this.filteredItems.forEach((item, i) => {
      if (this.isOdd(nbTour)) add = 0;
      else add = 1;
      // console.log(columns, [(i + add) % dimensions.cols])
      columns[i % dimensions.cols].appendChild(item);
      console.log(dimensions.cols, (i + add) % dimensions.cols);
      if (i % dimensions.cols === 0) nbTour++;
    });
    columns.forEach((col) => this.newGrid.appendChild(col));
  }

  isOdd(num) {
    return num % 2;
  }

  updateScales(event) {
    // if (!this.isFiltering) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    this.filteredItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemX = rect.left + rect.width / 2;
      const itemY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(this.mouseX - itemX, 2) + Math.pow(this.mouseY - itemY, 2)
      );

      if (distance < this.guiVal.threshold) {
        const scaleFactor =
          1 + (1 - distance / this.guiVal.threshold) * this.guiVal.scaleTarget; // Scale between 1 and 1.5
        gsap.to(item, {
          scale: scaleFactor,
          duration: this.guiVal.durationTarget,
          ease: "power3.inout",
        });
      } else {
        gsap.to(item, { scale: 1, duration: 1, ease: "power3.inout" });
      }
    });
    // }
  }

  prefixeClasses(isPre) {
    console.log(this.removedItems);
    this.allItems = this.removedItems
      ? this.filteredItems.concat(this.removedItems)
      : this.filteredItems;
    // Parcourez chaque élément et modifiez la première classe
    this.allItems.forEach((element) => {
      console.log(element);
      const classes = element.classList;
      const imgClasses = element.children[0].classList;

      if (classes.length > 0) {
        // Ajoutez le préfixe à la première classe
        const firstClass = classes[0];
        const imgFirstClass = imgClasses[0];
        const prefixedClass = isPre
          ? `xp_products-collection_item`
          : `products-collection_item`;
        const imgPrefixedClass = isPre
          ? `xp_collection_item-img`
          : `collection_item-img`;

        // Remplacez la première classe par la classe préfixée
        classes.replace(firstClass, prefixedClass);
        imgClasses.replace(imgFirstClass, imgPrefixedClass);
      }
    });
  }

  resize() {
    // Recalculate on window resize
    window.addEventListener("resize", () => {
      Draggable.get(".xp_section_collection")?.kill();
      // this.calculateGridSize();
      this.setupDraggable();
    });
  }

  // GRID VIEW

  toggleView() {
    this.isXPView = !this.isXPView;
    this.viewState = Flip.getState(
      this.filteredItems,
      ".page-wrapper, .xp-wrapper, .main-wrapper",
      ".products-collection_item",
      ".xp_products-collection_item"
    );
    if (this.isXPView) {
      this.timelineToXpView();
    } else {
      this.timelineToGridView();
    }
  }

  timelineToXpView() {
    this.viewButton.innerHTML = "grid view";

    gsap.to(this.other, {
      duration: 0,
      scale: 0,
    });
    this.toggleCardVisible();
    this.xpWrapper.classList.toggle("hidden");
    this.gridWrapper.classList.toggle("hidden");
    this.pageWrapper.classList.toggle("screen-height");
    this.prefixeClasses(true);

    // Make UI disappear here

    this.reconstructDOM();

    // or here ?

    // for (const [key, collection] of Object.entries(this.orderedCollections)) {
    //   collection.forEach((item) => {
    //     console.log(item);
    //     this.xpSectionCollection.appendChild(item.el);
    //   });
    // }

    this.flipToXp(this.viewState);
  }

  timelineToGridView() {
    // UI
    this.viewButton.innerHTML = "xp view";

    // Events
    window.removeEventListener("mousemove", this.throttledMouseMove);

    gsap.to(this.first, {
      delay: 0.2,
      scale: 0.8,
      overwrite: true,
    });
    // this.test = this.xpWrapper.querySelector(".xp_products-collection_item");
    const lists = Array.from(
      document.querySelectorAll(".products-collection_list")
    );

    // Elements
    gsap.to(this.other, {
      delay: 0.2,
      scale: 0,
      onComplete: () => {
        this.other.forEach((el) => {
          el.style.display = "none";
        });
        lists.forEach((list, i) => {
          const collection = list.dataset.collectionlist;
          this.orderedCollections[collection].forEach((item) => {
            console.log(item);
            list.appendChild(item.el);
          });
        });
        this.xpWrapper.classList.toggle("hidden");
        this.gridWrapper.classList.toggle("hidden");
        this.pageWrapper.classList.toggle("screen-height");
        this.prefixeClasses(false);
        this.flipToGrid(this.viewState);
      },
    });
  }

  // Create drag only once
  createDrag() {
    // Need resize update
    const widthItem = document
      .querySelector(".products-collection_item")
      .getBoundingClientRect().width;
    console.log(widthItem);
    document.querySelectorAll(".products-collection_list").forEach((el) => {
      const slides = gsap.utils.toArray(
        el.querySelectorAll(".products-collection_item")
      );
      const snapPoints = slides.map((_, i) => -(widthItem * i));
      console.log(slides, snapPoints);
      let direction;
      let currentSlide = 0;

      Draggable.create(el, {
        type: "x",
        bounds: {
          minX: snapPoints[slides.length - 1],
          maxX: 0,
        },
        inertia: true,
        onDrag: function () {
          direction = this.deltaX;
        },
        snap: function (value) {
          if (direction < 0 && currentSlide < slides.length - 1) {
            currentSlide++;
            console.log(currentSlide);
          } else if (direction > 0 && currentSlide > 0) {
            currentSlide--;
            console.log(currentSlide);
          }
          return snapPoints[currentSlide];
        },
      });
    });
  }

  viewDomChanges() {}

  toggleCardVisible() {
    this.itemsCard.forEach((card) => {
      card.classList.toggle("overflow-visible");
    });
  }

  // FOCUS

  handleFocus(e) {
    this.focusState = Flip.getState(".products-collection_item");
    e.target.classList.toggle("focusedItem"); // Add or remove the "hidden" class
    this.carouselFocus.appendChild(e.srcElement);
    this.grid.classList.toggle("asideGrid");
    this.flipOnFocus(this.focusState);
    gsap.to(e.srcElement, {
      scale: 1,
      duration: this.guiVal.durationTarget,
      ease: "power3.inout",
    });
    // this.addCollectionToCarousel()
  }

  addCollectionToCarousel() {
    for (let i = 1; i <= this.numItems; i++) {
      const div = document.createElement("img");
      div.src = "/plate800.webp";
      this.carouselFocus.appendChild(div);
    }
  }

  // GUI
  initGUI() {
    // Creating a GUI and a subfolder.
    var gui = new dat.GUI();
    var anim = gui.addFolder("Animations");

    // Add a number controller slider.
    if (!isMobile()) {
      anim.add(this.guiVal, "throttleInterval", 0, 200).onChange(() => {
        window.removeEventListener("mousemove", this.throttledMouseMove);
        this.throttledMouseMove = throttle(
          this.updateScales.bind(this),
          this.guiVal.throttleInterval
        ); // 50ms interval
        window.addEventListener("mousemove", this.throttledMouseMove);
      });
    }

    anim.add(this.guiVal, "scaleTarget", 0.1, 2);
    anim.add(this.guiVal, "durationTarget", 0.1, 2);
    anim.add(this.guiVal, "threshold", 100, 600);
  }
  // NOT FOUND

  showNotFound() {
    console.log("yes");
    this.notFound.classList.add("not_found_visible");
  }
  hideNotFound() {
    this.notFound.classList.remove("not_found_visible");
  }
}

// UTILS

// Utility function for throttling
function throttle(callback, delay) {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
}
function isMobile() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  // Check for common mobile devices
  return /android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
}

new Home();
