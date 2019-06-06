import { Component, OnInit, AfterContentChecked } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms'

import { switchMap } from 'rxjs/operators'
import toastr from 'toastr'
import { Entry } from '../shared/entry.model';
import { EntryService } from '../shared/entry.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../categories/shared/category.model';
import { CategoryService } from '../../categories/shared/category.service';

@Component({
  selector: 'app-entry-form',
  templateUrl: './entry-form.component.html',
  styleUrls: ['./entry-form.component.scss']
})
export class EntryFormComponent implements OnInit, AfterContentChecked {

  currentAction: string;
  entryForm: FormGroup;
  pageTitle: string;
  serverErrorMessages: string[] = null;
  submittingForm: boolean = false;
  entry: Entry = new Entry();
  categories: Array<Category>

  imaskConfig = {
    mask: Number,
    scale: 2,
    thusandsSeparator: '',
    padFractionalZeros: true,
    normalizeZeros: true,
    redix: ','
  };

  ptBR = {
    firstDayOfWeek: 0,
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    dayNamesMin: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sa'],
    monthNames: [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
      'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    today: 'Hoje',
    clear: 'Limpar'
  }

  constructor(
    private entryService: EntryService,
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private categoryService: CategoryService
  ) { }

  ngOnInit() {
    this.setCurrentAction();
    this.buildEntryForm();
    this.loadEntry();
    this.loadCategories()
  }

  ngAfterContentChecked() {
    this.setPageTitle()
  }

  submitForm() {
    this.submittingForm = true;

    if (this.currentAction == 'new')
      this.createEntry()
    else //currentAction =='edit'
      this.updateEntry()
  }

  get typeOptions(): Array<any>{
    return Object.entries(Entry.types).map(
      ([value, text]) => {
        return {
          text: text,
          value: value
        }
      }
    )
  }

  //PRIVATE METHOS
  private setCurrentAction() {
    //pegando a url que ta
    if (this.route.snapshot.url[0].path == 'new') {
      this.currentAction = "new"
    } else {
      this.currentAction = "edit"
    }

  }

  private buildEntryForm() {
    this.entryForm = this.formBuilder.group({
      id: [null],
      name: [null, [Validators.required, Validators.minLength(2)]],
      description: [null],
      type: ["expense", [Validators.required]],
      amount: [null, [Validators.required]],
      date: [null, [Validators.required]],
      paid: [true, [Validators.required]],
      categoryId: [null, [Validators.required]]
      // category Category,

    });
  }

  private loadEntry() {

    if (this.currentAction == 'edit') {
      this.route.paramMap.pipe(
        switchMap(params => this.entryService.getById(+params.get("id")))
      )
        .subscribe(
          (entry) => {
            this.entry = entry;
            this.entryForm.patchValue(this.entry) //binds loaded entry data to EntryForm
          },
          (error) => alert('Ocorreu um erro no servidor, tente mais tarde.')
        )
    }
  }

  private loadCategories(){
    this.categoryService.getAll().subscribe(
        categories => this.categories = categories
    );
  }

  private setPageTitle() {
    if (this.currentAction == 'new')
      this.pageTitle = 'Cadastro de Novo lançamento'
    else {
      const entryName = this.entry.name || ""
      this.pageTitle = 'Editando Lançamento: ' + entryName;
    }

  }

  private createEntry() {
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value); //criando categoria nova

    this.entryService.create(entry)
      .subscribe(
        entry => this.actionsForSuccess(entry),
        err => this.actionForError(err)
      )
  }

  private updateEntry() {
    const entry: Entry = Object.assign(new Entry(), this.entryForm.value);

    this.entryService.update(entry)
      .subscribe(
        entry => this.actionsForSuccess(entry),
        err => this.actionForError(err)
      )

  }

  private actionsForSuccess(entry: Entry) {
    toastr.success("Solicitação processada com sucesso!")

    //nomedosite.com/entries/new
    //nomedosite.com/entries/
    //nomedosite.com/entries/:id/edit

    //skipLocationChange =>  nao armazena no historico
    //redirect/reload component page
    this.router.navigateByUrl("entries", { skipLocationChange: true }).then(
      () => this.router.navigate(['entries', entry.id, 'edit'])
    )
  }

  private actionForError(err) {
    toastr.error("Ocorreu um erro ao processar a sua solicitação!")

    this.submittingForm = false;

    if (err.status == 422) //recurso nao processado com sucesso
      this.serverErrorMessages = JSON.parse(err._body).erros; //back de rails vem assim
    //ex.: ['nome ja existe','o email nao pode ficar em branco']
    else
      this.serverErrorMessages = ['Falha na comunicação com o servidor. Por favor tente mais tarde.']

  }

}
