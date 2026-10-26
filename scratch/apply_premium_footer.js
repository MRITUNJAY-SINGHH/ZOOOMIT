const fs = require('fs');
const path = require('path');

const newFooter = `        <!--...::: Footer Section Start :::... -->
        <footer class="section-footer relative overflow-hidden bg-[#FFFDF7] pt-14 sm:pt-16 lg:pt-20">
            <!-- Decorative Flowing Golden Yellow Bottom Wave (Spans 100% width, stays at bottom) -->
            <img src="assets/img/elements/footer-wave-shape.svg" alt="" class="pointer-events-none absolute bottom-0 left-0 z-0 w-full h-[120px] sm:h-[150px] lg:h-[180px] object-cover object-bottom opacity-95" />

            <!-- Main Footer Content Area (100% Width with 60px left-right padding, generous space above wave) -->
            <div class="relative z-10 w-full px-6 sm:px-10 lg:px-[60px] pb-24 sm:pb-28 lg:pb-32">
                <div class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-12 items-start">
                    
                    <!-- Column 1: ZOOOMIT Brand -->
                    <div class="flex flex-col gap-y-5">
                        <!-- Footer Logo -->
                        <a href="index.html" class="inline-block" aria-label="ZOOOMIT Home">
                            <img src="assets/img/logo-zooomit.svg" alt="ZOOOMIT" width="168" height="38" class="h-9 md:h-10 w-auto" />
                        </a>
                        <!-- Brand Description -->
                        <p class="text-sm sm:text-base font-normal leading-relaxed text-[#4A5568] max-w-[340px]">
                            Your everyday groceries and daily essentials, delivered with convenience. Shop your favourites and enjoy a simpler way to shop with ZOOOMIT.
                        </p>
                        <!-- Official Support Email Link -->
                        <div class="pt-1">
                            <a href="mailto:aetern.india@gmail.com" class="inline-flex items-center gap-2.5 text-sm sm:text-base font-bold text-ColorBlack transition-colors duration-200 hover:text-ColorYellow group">
                                <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF2B8] text-ColorBlack transition-transform duration-200 group-hover:scale-105">
                                    <i class="fa-solid fa-envelope text-ColorBlack text-base"></i>
                                </span>
                                <span>aetern.india@gmail.com</span>
                            </a>
                        </div>
                    </div>
                    <!-- Column 1 End -->

                    <!-- Column 2: Explore -->
                    <div class="flex flex-col gap-y-4 lg:pl-4">
                        <div>
                            <h4 class="text-lg font-bold text-ColorBlack tracking-normal">Explore</h4>
                            <div class="mt-1.5 h-1 w-7 rounded-full bg-ColorYellow"></div>
                        </div>
                        <ul class="flex flex-col gap-y-3 text-sm sm:text-base font-medium text-[#4A5568]">
                            <li>
                                <a href="index.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Home</a>
                            </li>
                            <li>
                                <a href="index.html#section-features" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Features</a>
                            </li>
                            <li>
                                <a href="index.html#section-about" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">About Us</a>
                            </li>
                            <li>
                                <a href="faq.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">FAQs</a>
                            </li>
                            <li>
                                <a href="contact.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Contact Us</a>
                            </li>
                        </ul>
                    </div>
                    <!-- Column 2 End -->

                    <!-- Column 3: Legal & Policies -->
                    <div class="flex flex-col gap-y-4 lg:pl-2">
                        <div>
                            <h4 class="text-lg font-bold text-ColorBlack tracking-normal">Legal &amp; Policies</h4>
                            <div class="mt-1.5 h-1 w-7 rounded-full bg-ColorYellow"></div>
                        </div>
                        <ul class="flex flex-col gap-y-3 text-sm sm:text-base font-medium text-[#4A5568]">
                            <li>
                                <a href="privacy-policy.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="terms-and-conditions.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Terms &amp; Conditions</a>
                            </li>
                            <li>
                                <a href="shipping-policy.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Shipping Policy</a>
                            </li>
                            <li>
                                <a href="return-refund-policy.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Return &amp; Refund Policy</a>
                            </li>
                            <li>
                                <a href="delete-account.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Delete Account</a>
                            </li>
                            <li>
                                <a href="contact.html" class="transition-all duration-200 hover:text-ColorBlack hover:translate-x-1 inline-block">Contact Support</a>
                            </li>
                        </ul>
                    </div>
                    <!-- Column 3 End -->

                    <!-- Column 4: Get the ZOOOMIT App (Clean column with Play Store download link) -->
                    <div class="flex flex-col gap-y-4">
                        <div>
                            <h4 class="text-lg font-bold text-ColorBlack tracking-normal">Get the ZOOOMIT App</h4>
                            <div class="mt-1.5 h-1 w-7 rounded-full bg-ColorYellow"></div>
                        </div>
                        <p class="text-sm sm:text-base font-normal leading-relaxed text-[#4A5568]">
                            Shop groceries and daily essentials anytime, anywhere from your phone.
                        </p>

                        <!-- Play Store Download Link -->
                        <div class="pt-1">
                            <a href="https://play.google.com/store/apps" target="_blank" rel="noopener noreferrer" class="inline-block transition-transform duration-200 hover:scale-105" aria-label="Get it on Google Play">
                                <img src="assets/img/icons/icon-google-play-store.svg" alt="Get it on Google Play" width="165" height="50" class="h-10 sm:h-11 w-auto" />
                            </a>
                        </div>
                    </div>
                    <!-- Column 4 End -->

                </div>
            </div>

            <!-- Full-Width 100% Simple Clean Copyright Bar (60px Left-Right Padding) -->
            <div class="relative z-20 w-full bg-[#0A102F] py-4 sm:py-5 px-6 sm:px-10 lg:px-[60px] text-center text-xs sm:text-sm font-medium text-white/80">
                &copy; <span id="current-year">2026</span> ZOOOMIT. All rights reserved.
            </div>
        </footer>
        <!--...::: Footer Section End :::... -->`;

const dir = path.join(__dirname, '../Website');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updatedCount = 0;
files.forEach(f => {
    const filePath = path.join(dir, f);
    const content = fs.readFileSync(filePath, 'utf-8');

    const startMarker = '<!--...::: Footer Section Start :::... -->';
    const endMarker = '<!--...::: Footer Section End :::... -->';

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
        const before = content.substring(0, startIndex);
        const after = content.substring(endIndex + endMarker.length);
        const updated = before + newFooter + after;
        fs.writeFileSync(filePath, updated, 'utf-8');
        console.log(`Updated footer in: ${f}`);
        updatedCount++;
    } else {
        console.warn(`Markers not found in: ${f}`);
    }
});

console.log(`Successfully updated ${updatedCount} HTML files.`);
