<template>
    <section>
      <div class="mx-auto py-6 prose !container dark:prose-invert">
        <h2 class="px-4 sm:px-0">Highlights</h2>
        <div class="flex gap-4 flex-col">
          <VCard>
            <VCardContent>
              <h3 class="mt-2 mb-0">Incorrect Maps</h3>
              <span class="text-base-soft">2023-10-09</span>
              <p>
                At the genus level and above, all taxa that occur in overseas
                departments and territories are erroneously also shown to occur in
                the respective administrative country authority and viceversa
                (e.g. French Guiana/France). This issue will be solved ASAP.
              </p>
            </VCardContent>
          </VCard>
          
          <VCard>
            <VCardContent>
              <h3 class="mt-2 mb-0">Taxa Completed</h3>
              <span class="text-base-soft">2023-10-09</span>
              <p>
                Not all the subfamilies are completed, menaing that some names are missing.
                Therefore, before citing the contents, make sure to take a look at the
                document here
              </p>
            </VCardContent>
          </VCard>  

          <VCard>
            <VCardContent>
              <h3 class="mt-2 mb-0">OSF Powered by TaxonWorks</h3>
              <span class="text-base-soft">2023-04-17</span>
              <p>
                OSF lives in TaxonWorks, the new infrastructure that powers OSF.
                The interfaces of TaxonWorks include a wide range of additional
                filtering and reporting functionalities. Please contact us
                (<address-maker
                  class="font-medium"
                  :items="['davide.dalpos', 'ucf', 'edu']"
                />;
                <address-maker
                  class="font-medium"
                  :items="['filippod', 'unisiena', 'edu']"
                />) if you need extended access to the data. Over time we expect
                this site to gradually mirror these extended functionalities of
                TaxonWorks.
              </p>
            </VCardContent>
          </VCard>
        </div>
      </div>
    </section>
</template>
  